# Chronic dilated HFrEF research reference, 2026-09-09

The readable study, primary-source assessment, design rationale and measured
candidate comparison are in `artifacts/hfref-domain-v1/REPORT.md`. This archive
adds a research reference; it does not promote a preset or mint an exact model.

`evidence.tar.gz` retains paths relative to `artifacts/hfref-domain-v1/`:

Archive SHA-256: `6de7761e8a79b1079c2a1f424969c0d5e389f0b6ae773b3772930bf3e62e783a`.

- `REPORT.md`: the study through reference registration and re-observation.
- `phenotype-reference-review/`: the common independent-review brief, Fable's
  returned text/JSON, a labeled Astra summary, and the primary agent's adoption
  decision. Astra approved research-reference registration; Fable was conditional.
  Exactly one approving vote was used for the user-authorized 1/2 gate.
- `chronic-reference-reassessment-002/`: analysis-source archive/sidecar, composed
  reference, fit-quality-aware observations, case-feature facts and summary for
  16 existing traces. No new numerical integration, checkpoint transition or
  original-data overwrite occurred. The first re-observation's outputs were
  identical; this sealed copy includes the final comparator source.

The original corrected numerical data are already retained in
`research-history/hfref-remodeling-v1/evidence.tar.gz`, under
`remodeling-fixed-bed-003/` and `remodeling-fixed-bed-1ms-003/`. They are not
duplicated here. Each original execution and this re-observation have separate
source and result hashes; re-observation is not independent prospective validation.

Extract both archives into a new empty directory if reproduction is needed.
Verify `analysis.source.json` against its archive and outputs, then use the
archived source and lockfile to run:

```sh
npx vite-node --script tools/scientific/reassessHfrefRemodelingV1.ts \
  --input PATH_TO/remodeling-fixed-bed-003 \
  --input PATH_TO/remodeling-fixed-bed-1ms-003 \
  --output NEW_DIRECTORY
```

Both time steps have 3/8 broad screen passes and 0/8 all-target passes. The
promising dilated construction still misses the preferred mean aortic pressure;
passive geometry, pericardial/coronary assumptions and final preset qualification
remain open. Unqualified Glantz fits, Ees, passive EDPVR and PVA are not supplied
as valid measurements or article conclusions.

Typecheck and 55 focused tests passed. Full PR smoke had 848 passing tests and
8 failures in two previously inconsistent research/production boundaries. Those
same 8 failures reproduce from pre-change HEAD `2bcedfa4`; the filtered JSON
check is retained with the reviews. This archive is not an all-green release.
No research papers, screenshots, authentication state or installed dependencies
are redistributed.
