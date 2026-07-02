# LA Pressure Shadow Substitution V1

This bench runs the first shadow source-surface substitution smoke after
`LaLatePeakResidualAttributionV1`.

Mode:

- replay the selected left-heart source trace,
- replace LAP only inside a shadow MV valve replay with the decomposed LA
  pressure contract,
- do not commit chamber volumes, source surfaces, reservoir state, runtime
  wiring, AV-plane geometry, or LandAtrial state.

Report:

- `data/mechanics2/reports/la-pressure-shadow-substitution-report-v1.json`

Result:

- Decision: `la-pressure-shadow-substitution-blocked`.
- Pass: 2/7.
- Shadow MVF clean: 3/7.
- Pressure-gradient support clean: 7/7.
- Shadow E/A single-peak collapse: 4/7.
- Shadow forward-volume wide: 1/7.
- Max adverse gradient during forward flow: ~0.027.
- Max shadow negative-energy excess over current MV replay: ~0.010.

Interpretation:

- The decomposed LAP does not create an adverse pressure-gradient support
  problem in the current source-surface trace.
- Closed-loop pressure substitution remains blocked because shadow MV valve
  replay collapses E/A separation in four profiles and amplifies forward volume
  in the low-contractility profile.
- The next residual owner is the decomposed atrial active pulse shape and MV
  valve replay response, not reservoir tuning, AV-plane geometry, or LandAtrial.

Claim boundary:

- No source-surface substitution.
- No runtime wiring.
- No morphology acceptance.
- No AV-plane geometry.
- No piston-volume mode.
- No LandAtrial unlock.
