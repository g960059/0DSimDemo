# Fixed-geometry chronic dilated HFrEF research, 2026-09-09

The study is in `artifacts/hfref-domain-v1/REPORT.md`. This records a target-matched
research candidate, **not** an adopted preset, a new exact model, or an admitted
continuous geometry domain. The existing reference and physiological thresholds
were not changed.

`evidence.tar.gz` retains paths relative to `artifacts/hfref-domain-v1/`:

Archive SHA-256: `cc63c907228b3625fa18bae29a7238ca2bc7d09a4cf846d7819aa8340afbd76b`.

- `REPORT.md`: protocol, primary-source rationale, results, counter-findings,
  limitations and next decisions.
- `passive-conditional-001/`: 60 pressure-matched relaxed, active-off ventricular
  points, conditional on RV volume. All targets resolved; two other exploratory
  cold-grid failures remain recorded. This is not dynamic clinical EDPVR.
- `dilated-fixed-geometry-fit-001/`: nine independently cold-settled 2 ms cases.
- `dilated-fixed-geometry-fit-1ms-001/`: independent 1 ms confirmation of case 2.
- `dilated-preload-2ms-001/`, `dilated-preload-1ms-001/`: low/high TBV endpoints
  at each dt, using existing 0.88/1.12 volume ratios but independent cold
  settling, **not** the formal reservoir-fork qualification protocol.
- `dilated-evidence-summary.json`, its script, and the raw scientific-plot script.
  The SVG/PNG plots were produced after numerical execution and are retained in
  this archive; they are not listed as original execution outputs.

Each execution retains its own source archive, inventory and output hashes.
The summary script rechecked the five archive/inventory/output bindings.
Original healthy comparators and the pre-fit factorial are already retained in
`research-history/hfref-remodeling-v1/evidence.tar.gz`; they are not duplicated.
Use the source and lockfile from the relevant execution to reproduce a result.
The test source and subsequent runner changes remain in this Git commit.

Case 2 uses the same selected geometry/tissue/active scales, TBV 4935 mL, and
existing systemic resistance 1.20. At 1 ms: EF 28.48%, EDVI 113.42 mL/m²,
CI 2.261 L/min/m², mean Ao storage-node pressure 81.13 mmHg, mean LA 16.60 mmHg,
qualified Weiss tau 50.81 ms. Four of nine coarse cases meet the existing targets;
case 2 was selected by the preregistered input order without adding TBV.

High TBV barely changes output. Roughly 94–95% of the *increase* in LV native
end-filling cavity pressure is external/pericardial pressure. That is a pressure
decomposition, not a causal contribution to the output plateau. Pericardial
adaptation, fixed coronary-bed applicability and dynamic mechanical diagnostics
still require disposition before public exposure or adoption. Unqualified Glantz,
formal Ees, dynamic EDPVR, PVA and oxygen-efficiency claims remain excluded.

Typecheck and 58 focused tests pass. The earlier full PR-smoke run had eight
known research/production-boundary failures; it was not rerun or declared green
here. No workbench preset, baseline, parameter range, production Surface or
analysis pin was changed. No additional independent-review vote is claimed.
No paper PDFs, screenshots from publications, credentials or dependencies are
redistributed.
