# Four-Chamber Source-Aware Contract Smoke V1

This smoke promotes the source-aware status ownership signal into a bounded
four-chamber contract smoke. It does not change true four-chamber dynamics.

Report:

- `data/mechanics2/reports/four-chamber-source-aware-contract-smoke-report-v1.json`

Result:

- Decision: `source-aware-four-chamber-contract-smoke-reservoir-repeatability-blocked`
- Contract pass count: 20/21.
- Nominal: 7/7.
- `dt-half`: 7/7.
- Long epochs: 6/7.
- Remaining blocker: `long-epochs/preload-low` with
  `persistent-large-reservoir-shuttle`.
- Remaining blocker details: max reservoir volume ~28.51 mL, final reservoir
  step ~1.16 mL, max accepted transfer ~1.77 mL, forward mismatch ~8.28 mL.

Claim boundary:

- This is not runtime wiring, true four-chamber dynamics, morphology
  acceptance, reservoir retuning, AV-plane work, or LandAtrial work.
- Next work should focus only on the long-epoch preload-low reservoir
  repeatability blocker, without broad reservoir tuning or atrial work.
