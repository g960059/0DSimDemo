# Four-Chamber Source-Aware Residual Review V1

This diagnostic reclassifies the selected four-chamber residuals after the
source-surface contract and right-preload PV outflow ownership evidence.

Report:

- `data/mechanics2/reports/four-chamber-source-aware-residual-review-report-v1.json`

Result:

- Decision: `source-aware-four-chamber-review-actionable`
- Raw failed four-chamber profile count: 4.
- Raw left failure reclassified by source-aware evidence: 1.
- Source lead exists but direct transfer remains blocked: 1.
- Coupled reservoir or phenotype-scope blockers remain: 2.

Interpretation:

- `dt-half/preload-low` splits into left phase-aligned source parity plus a
  right PV outflow ownership lead that must not be directly transferred into
  the four-chamber scaffold.
- `dt-half/afterload-high` is a left load-conditioned output reserve issue that
  can be represented at the source contract layer.
- `dt-half/contractility-low` remains a coupled low-output phenotype-scope
  blocker even though both standalone source surfaces are clean low-output
  points.
- `long-epochs/preload-low` remains a reservoir repeatability blocker.

Claim boundary:

- This is not runtime wiring, true four-chamber dynamics, morphology
  acceptance, reservoir retuning, AV-plane work, or LandAtrial work.
- Next work should implement a source-aware four-chamber contract before
  changing reservoir or atrial surfaces.
