# Standard70 baseline and ejection research archive

Research-only snapshot; **do not merge this directory or the rejected AV
momentum experiment into main**. Production integration is a separate minimal
change. Exact-model identity, immutable artifact and Model Surface have not
been replaced by the PV-shape experiments.

## Evidence retained

`raw-evidence.tar.gz` preserves 297 original files (298,035,764 uncompressed
bytes). `manifest.json` records every original byte hash and the archive hash.
The three original directory names are retained so relative report links work
after extraction. No files were rewritten inside the archive.

- `main-wire-baseline-fit-current.5Y0SEd`: bounded searches, rejected boundary
  probes, final v7 qualification, original requests/checkpoints, browser launch
  preparation and plotting scripts. The original one-candidate final v7 run
  completed in 146.460 seconds; that is not total search time.
- `main-wire-ejection-coupling.LPKuEn`: native pressure/flow timing readback,
  canonical/zero-L/fixed-L comparisons at 2 and 1 ms, prior intermediate runs,
  complete accepted traces, figures and the original report.
- `main-wire-ejection-balance.EDABuD`: material/geometry and arterial balance
  readback at 2, 1, 0.5 and 0.25 ms, intermediate/failed runs, complete accepted
  traces, figures and the original report.

Readable copies: [coupling report](coupling-report.md),
[balance report](balance-report.md). Their linked run files are inside the
archive, not additional uncompressed files in Git. Original local source paths
are historical provenance, not prerequisites at those absolute locations.
Per-run execution commits and source hashes remain authoritative; the archive
commit is not relabelled as the execution commit. This bundle supplements the
earlier studies already recorded in PR #609 and its comments; it does not claim
to contain every raw file from every earlier branch investigation.

## Adoption decisions

The selected **launch baseline**, distinct from immutable exact defaults, is
HR70, TBV5050 mL, systemic resistance1.01, arterial stiffness1.42, common
ventricular active tension1.32 and passive stiffness1.04. Pulmonary
resistance0.625, venous tone0.15, Ca/Land kinetics and valve areas stay fixed.
The saved capture remains authoritative when reopening an existing experiment.

Nominal selected outputs: AoP98.848/74.764 mmHg, CI2.7334 L/min/m²,
CVP3.4047 mmHg, PCWP9.6599 mmHg, AV ET244 ms, raw mean/peak LV–Ao
gradient3.9394/6.8768 mmHg, ICT63.143 ms, IRT88 ms, Tei0.61944,
native-flow E/A0.82048. LV +dP/dt2587.06 mmHg/s remains a reference warning.
High-volume LV CO reserve4.3278% is a modest improvement, not a reserve optimum
or clinical normality certificate. Cold, refined timestep, other HR and formal
bidirectional preload checks passed under the recorded policy. No afterload
qualification was required. Scope and measurement definitions matter.

**Fixed AV L was rejected as a baseline improvement.** At 1 ms, it increased
Qpeak434.9→467.7 mL/s and raw peak gradient6.946→12.961 mmHg; ET242→246 ms.
It allowed positive flow with adverse pressure gradient but did not resolve
the early peak or the small late-ejection indentation. Do not generalize this
single short probe to all inertial models or all operating conditions.

The late-ejection midpoint-to-chord residual was −0.17264 mmHg at0.25 ms in
the prescribed 60–85% expelled-volume window. This is not ET60–85%, a clinical
curvature threshold, or a newly qualified periodic solution. Fixed-geometry
stress decomposition and arterial ledger are views of the same coupled path,
not independent causal interventions. Negative passive restoring stress was
not removed. No curvature-based gate, cosmetic pressure correction, new Ca
source, new exact identity or new Surface was adopted.

## Reproduction and limits

Use the archive branch's source and package lock. Reports contain original
commands and source hash bindings. Extract into a new directory, resolve paths
relative to the extracted directory, and use new output directories; do not
overwrite historical evidence. Numerical candidate failure and intermediate
outputs are retained, not recast as successful final studies.

The ordinary cycle/qualification minimum timestep remains1 ms. Only the
explicit research replay entry permits0.5/0.25 ms. The fixed-L state is owned
by an in-memory research wrapper and is not a Standard70 checkpoint extension.
These experimental hooks and their regression tests are archived here with
source history and deliberately excluded from production extraction.

Before archival: typecheck and53 research tests passed;3 research-cycle tests
passed (5 other cases in that file were not selected); suite registration6
tests passed. Broader regression results and subsequent production extraction
checks are recorded separately in the PR. A successful source test is not an
independent physiological validation.
