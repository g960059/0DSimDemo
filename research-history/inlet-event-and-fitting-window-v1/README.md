# Inlet event and fitting observation-window audit

2026-09-10. `diagnostics.tar.gz` and `fitting-regression.tar.gz` preserve the
completed investigation with paths relative to `artifacts/inlet-event-audit-v1/`.
Extract both into that directory; their file paths are disjoint. They are split
by purpose to stay below GitHub's per-file size limit. `diagnostics.tar.gz`
contains `REPORT.md`, the Japanese report, measurements, scope and failed
diagnostic attempts; `fitting-regression.tar.gz` holds fitting runs and test
reports, including failed attempts. See the archive hashes below.

- `diagnostics.tar.gz`: SHA-256 `dab2680b9f359a044b923d51e5628c5bd49c03d424b56ebc3d2bc402da31e7e3`
  (59 members; 70,542,832 bytes).
- `fitting-regression.tar.gz`: SHA-256 `c71d1b6a6c32266833572ae7e5cc5c5986e357368bcd18c114c84f848366bfff`
  (38 members; 41,572,798 bytes).

Their combined regular-file inventory matches the full verified evidence
archive without omissions or duplicate file paths.

The selected chronic LV-dilated HFrEF case at TBV 4785 mL (150 mL below its
reference) has tiny recurrent TV forward flow at 2/1 ms. It disappears at
0.5/0.25 ms in the fully observed subsequent beats, including P1 reconfirmation
and a withheld beat. Opening fraction decreases during recurrence: this is not
leaflet reopening, simultaneous TV/PV flow, or ringing of a TV flow inertance.
The evidence favors a grid-sensitive pressure zero crossing; it does not prove
continuous-time behavior or explain earlier LVP/PV-loop morphology.

The shared fitter now retains actual preceding samples covering the entire
native cardiac beat. The original terminal/lookahead binding stays enforced.
Gaps, overlaps and reversed preceding samples fail closed. The fitting policy
identity changes, not the exact model, numerical schedule or physiological
thresholds. No small-flow clipping, smoothing or automatic fine-grid fallback.
Ordinary-grid low-TBV results remain unavailable, not passed.

Final baseline/HFrEF cold runs preserve the previous inputs, full checkpoints,
completed beats, terminal traces and complete rest assessments exactly.
Each retains 72 real preceding samples; both warm rechecks use three cycles.
Final source inventory: `9a7fe263aeb9f9b488f7d118ade7304b33d4e8ae1261f0e58fa70bbbd97a90e8`.
The result/source integrity audit is `evidence-audit-final.json`; it is not an
independent scientific review. It also checks the companion ordinary-Worker
archive's run records.

Observation tests 13, focused fitting tests 22, fast 1187, PR smoke 875,
typecheck and production build passed. Test suites overlap; full canonical
and nightly were not run. Reference checkpoint inputs come from the earlier
`case-fitting-and-filling-v1` archive. Failed drivers and intermediate results
are retained. No credentials, supplied screenshots, paper PDFs or installed
dependencies are included. No mint, publication or case experiment/article.
