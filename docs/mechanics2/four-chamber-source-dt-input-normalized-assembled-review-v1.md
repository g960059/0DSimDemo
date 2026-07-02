# Four-Chamber Source dt Input Normalized Assembled Review V1

This review applies source-ledger input normalization to the selected smooth
reservoir scaffold for the `dt-half` assembled envelope.

Report:

- `data/mechanics2/reports/four-chamber-source-dt-input-normalized-assembled-review-report-v1.json`

Result:

- Decision: `source-dt-input-normalized-assembled-review-signal`.
- Effective envelope: 21/21.
- `dt-half` reservoir parity: 7/7.
- `dt-half` reservoir parity failed profiles: none.
- Raw `dt-half` source failures remain visible:
  `preload-low`, `afterload-high`, and `contractility-low`.
- Effective `dt-half` source failures after applying source-aware owners to
  the normalized run itself: none.
- Normalized ledger source statuses are clean: 7/7.
- Hard limiter is free.
- Smooth reservoir feedback is still active in the expected long-epoch scaffold,
  so feedback duty is reported rather than used as a zero-duty pass condition.

Interpretation:

- Source-ledger input normalization removes the assembled `dt-half` reservoir
  magnitude parity residual without reservoir retuning or direct PV outflow
  transfer.
- Effective status is computed from the normalized run's own failure reasons;
  raw status-rate failures are stored separately and remain visible.
- This is a source/reservoir contract signal, not runtime or physiology
  acceptance.

Claim boundary:

- This is not runtime wiring, true four-chamber dynamics, morphology
  acceptance, reservoir retuning, direct PV outflow transfer, AV-plane work, or
  LandAtrial work.
