# Four-Chamber PV Outflow Transfer Review V1

This diagnostic tests whether the standalone right-preload PV outflow ownership
lead can be transferred directly into the selected four-chamber scaffold.

Report:

- `data/mechanics2/reports/four-chamber-pv-outflow-transfer-review-report-v1.json`

Result:

- Decision: `pv-outflow-direct-transfer-no-go`
- Reference total pass count: 17/21 across nominal, `dt-half`, and long-epoch
  scenarios.
- Direct full-pass candidates: 0.
- The standalone `pv-resistance150` lead improves the `dt-half/preload-low`
  right surface, but it reduces nominal and long-epoch pass counts and
  introduces broader right-surface, forward-mismatch, and reservoir-shuttle
  failures.

Claim boundary:

- This does not reopen reservoir tuning.
- This does not unlock runtime wiring, true four-chamber dynamics, AV-plane
  work, LandAtrial work, or morphology acceptance.
- Next work should build a source-aware four-chamber review that separates
  phase-aligned source failures and magnitude calibration instead of directly
  transferring standalone source leads.
