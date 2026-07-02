# AtrialFiberPack Closed-Loop Replay V1

This bench replays the selected MechanicsCore2 closed-loop LA/RA volume
trajectories through `AtrialFiberPackV1` without substituting atrial fiber
pressure back into the source surfaces.

Report:

- `data/mechanics2/reports/atrial-fiber-pack-closed-loop-replay-report-v1.json`

Result:

- Decision: `atrial-fiber-closed-loop-replay-signal`.
- Upstream AtrialFiberPack prescribed-volume signal is present.
- AV-plane-off closed-loop volume replay passes: 14/14.
- LA replay passes: 7/7.
- RA replay passes: 7/7.
- Outputs are finite, bounded, smooth enough for this replay gate, and
  late-active in all rows.
- Fiber/current pressure parity is 11/14.

Residual:

- LA pressure parity remains advisory-wide in `preload-high`,
  `afterload-high`, and `contractility-low`.
- This is not a morphology failure for the replay gate, but it blocks direct
  atrial pressure substitution.
- The follow-up attribution report is
  `data/mechanics2/reports/atrial-pressure-parity-attribution-report-v1.json`.

Interpretation:

- LA/RA one-fiber wall mechanics can follow the selected closed-loop volume
  trajectories without AV-plane geometry and without hidden volume changes.
- The follow-up attribution shows the raw atrial wall pressure needs a
  decomposed pressure contract before any pressure-substitution smoke.

Claim boundary:

- No runtime wiring.
- No atrial pressure substitution.
- No morphology acceptance.
- No AV-plane geometry.
- No piston-volume mode.
- No LandAtrial unlock.
