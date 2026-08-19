# PR558 research-archive retrospective

Status: active decision record; no runtime or scientific claim is introduced

## Archive boundary

Pull request [#558](https://github.com/g960059/0DSimDemo/pull/558) is a
research archive, not a merge candidate. Its complete history is fixed at:

- tag:
  `research-archive/passive-equilibrium-v2-failed-2026-08-19`;
- head commit: `73a0d7008e49f451bf0062b48502295086be52a0`;
- evidence access copy:
  [research archive release](https://github.com/g960059/0DSimDemo/releases/tag/research-archive/passive-equilibrium-v2-failed-2026-08-19).

The tag is the authoritative Git boundary. The release contains the result
document, archive index, and deterministic gzip copies of the artifact and
journal. Raw scientific identities and archive-encoding identities remain
separate in that index. None of those large evidence files are inputs to the
current runtime or future passive-surface construction.

PR558 must not be merged, rebased, squashed, force-pushed, or rerun. In
particular, the consumed passive-equilibrium V2 engineering attempt remains a
failed result with official eligibility false.

## Retained conclusions

| Lane                                                | Retained conclusion                                                                                                                                                            | Current action                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Periodic ventricular external work                  | The archived implementation passed its frozen 1 ms/0.5 ms admission, pressure-basis decomposition, checkpoint, and accepted-path gates.                                        | Extract the analysis core from current `main` in a small Engineering-only PR. Historical qualification does not automatically transfer to a reconstructed implementation identity. |
| Valve-event locus V1                                | The retained failure established that circular beat-boundary semantics and principal-flow episode pairing are required.                                                        | Defer V2. Do not use the locus as a PVA owner.                                                                                                                                     |
| Five-wall mechanical-port and passive-energy ledger | The work established the accounting structure and exposed a measurement-taxonomy mismatch plus first-order discrete terms. Its official admission remained failed.             | Defer a new admission policy until a downstream comparison needs it.                                                                                                               |
| Passive-equilibrium point solver V2                 | A stable reference root and a tight successful-participant subset were retained. The required midpoint and seed conjunctions failed near the binary64 energy-difference floor. | Do not reject the passive potential, but do not claim a surface, branch robustness, uniqueness, EDPVR, PE, or PVA. Keep V3 unselected pending repeatable solver comparisons.       |

The historical documents on the archive tag are not rewritten. This record
supersedes only their implied next-work priority.

## Development policy after PR558

Numerical development and confirmatory qualification are separate workflows:

- **Engineering mode** is repeatable, compact, and explicitly unqualified. It
  may compare solver policies on manufactured and declared development cases.
- **Confirmatory mode** is used only after the policy and held-out inputs are
  frozen. It owns immutable qualification evidence and must fail closed.

The first rescue is limited to the periodic external-work analysis core and
focused tests. Valve-event V2, ledger V2, passive solver V3, a 33 by 33 passive
surface, PVA, myocardial oxygen consumption, ATP, and efficiency are outside
that extraction.

Residual-merit Newton is the leading V3 candidate, not the selected policy. A
future Engineering PR must compare it with declared alternatives and preserve
separate claims for a point-local stable root, deterministic primary lineage,
alternate-path agreement, multi-seed robustness, and global uniqueness.

Only after a point solver is selected should a nonofficial 3 by 3 or 5 by 5
local passive-surface pilot be considered. Such a pilot is solver-development
evidence, not yet a passive reference qualified for PVA.
