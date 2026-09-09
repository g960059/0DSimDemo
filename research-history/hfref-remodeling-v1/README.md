# Static LV remodeling research, 2026-09-09

Research archive only. No new exact-model release, geometry control, baseline,
HFrEF preset or numerical gate is adopted here. The full human-readable research
and primary-literature assessment is `artifacts/hfref-domain-v1/REPORT.md`.

`evidence.tar.gz` preserves the following paths relative to
`artifacts/hfref-domain-v1/`, including each original source archive:

Archive SHA-256: `8fddd5ca6d6cebd9e51edd4208a480535493442c1960130f39f6931e2ebf49a7`.

| Directory | Status |
|---|---|
| remodeling-factorial-001 | Initial 2 ms factorial; M=1.25 omitted tissue from pericardial occupancy. Superseded, not deleted. |
| remodeling-factorial-1ms-001 | Same initial construction, 1 ms. Numerical repeatability did not resolve its anatomical mismatch. |
| remodeling-fixed-bed-002 | Repaired occupancy, 2 ms; diagnostic harness failed after settling by expecting rich readback on the lean path. |
| remodeling-fixed-bed-1ms-002 | Interrupted harness attempt; source and plan only, no sealed results. |
| remodeling-fixed-bed-003 | Corrected diagnostic harness, 8 observed cases, 2 ms. |
| remodeling-fixed-bed-1ms-003 | 8 observed cases, 1 ms. |
| remodeling-review | Neutral brief, complete Astra/Fable independent reviews, erratum, parent adoption decisions. |

The plot script and raw-sample SVG comparison are included. Downloaded research
papers and user screenshots are not redistributed in this archive; citations,
source access limits, measured definitions and table observations are in REPORT.

Extract into a new empty directory. For each completed run, verify its source
archive and output files against `execution.source.json`. The five sealed runs
have 50 bound output files; their digests were verified before archiving. The
interrupted directory explicitly does not have that provenance guarantee.
The two successful corrected runs share source inventory SHA-256
`d62e7d5ff65bec35f817b8a51eb721abfa442fae2c86139ffdc02c14ffbc8b8a`.
Both preserve actual tissue occupancy but intentionally hold the baseline
reference coronary bed and demand. Current mechanical mass is stored separately;
this is not a coronary remodeling or perfusion-per-gram qualification.

Reproduction: use the archived source and locked dependencies, then invoke
`npx vite-node --script tools/scientific/runHfrefRemodelingAblationV1.ts --output NEW_DIRECTORY --workers 8 --dt .002`
(or `.001`). The runner cold-starts every point, owns its source snapshot, and
never exports/imports a production checkpoint for changed geometry. Its finite
factorial is not an admitted continuous parameter domain. Geometry diagnostics
come from the accepted state; unexposed generalized-force residuals remain null.

Review scope matters: both independent reviewers supported the distinct phenotype
research and conditionally supported design screens, but neither approved
permanent geometry/range/workbench exposure. Their review predates the corrected
run; its results are not claimed to have been reviewed in advance.

Post-run harness-only change: an unresolved batch now exits unsuccessfully after
sealing its evidence, preventing a chained fine-step run from repeating a known
failure. This does not alter the archived numerical execution. Typecheck and 33
focused construction, pericardium, reference and Surface/control tests passed.
