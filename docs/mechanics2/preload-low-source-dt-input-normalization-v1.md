# Preload-Low Source dt Input Normalization V1

This diagnostic separates source status evaluation from the forward-ejection
input used by the reservoir ledger for the localized `preload-low` `dt-half`
reservoir parity residual.

Report:

- `data/mechanics2/reports/preload-low-source-dt-input-normalization-report-v1.json`

Result:

- Decision: `source-dt-input-normalization-signal`.
- Raw `dt-half` reservoir delta versus nominal: ~15.39 mL.
- Canonical-ledger `dt-half` reservoir delta versus nominal: 0 mL.
- Raw and canonical-ledger feedback duty: 0.
- Raw and canonical-ledger hard-limiter duty: 0.
- Canonical ledger source statuses are clean.
- Status-rate source failures remain reported.

Interpretation:

- The localized residual is caused by sample-rate-dependent source inputs to the
  reservoir ledger, not by reservoir feedback or the hard limiter.
- This does not hide status-rate source failures; it only tests a source-ledger
  input normalization candidate.

Claim boundary:

- This is not runtime wiring, true four-chamber dynamics, morphology
  acceptance, reservoir retuning, direct PV outflow transfer, AV-plane work, or
  LandAtrial work.
