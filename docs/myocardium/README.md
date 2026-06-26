# Myocardium Revision 3

Status: Proposed Phase 0
Bundle source: local import, path redacted
Baseline repository commit: `228bef96e5f522de2cfe352de5d6d4d2f017c550`

Revision 3 is the current planning namespace for the myocardial contraction
subsystem replacement. It is not a patch plan for the existing
`ActiveStressChamberModel`, and it does not change runtime TypeScript behavior
until Phase 0 owner decisions are accepted.

## Read order

| Priority | Document | Purpose |
|---:|---|---|
| 1 | [adr/ADR-MYO-001.md](adr/ADR-MYO-001.md) | Scope, decision, consequences, required owner decisions |
| 2 | [model-spec/myocardium-land-v1.md](model-spec/myocardium-land-v1.md) | Normative model/API/units/state/solver contracts |
| 3 | [verification/myocardium-v1-verification.md](verification/myocardium-v1-verification.md) | Target freeze, verification tiers, GO/REVISE/NO-GO gates |
| 4 | [roadmap/myocardium-rebuild-roadmap.md](roadmap/myocardium-rebuild-roadmap.md) | Phase and PR sequencing |
| 5 | [research/myocardial-contraction-rebuild-design-record.md](research/myocardial-contraction-rebuild-design-record.md) | Background rationale and design discussion |

When these documents disagree, use this precedence:

```text
accepted ADR
> model spec
> verification plan
> roadmap
> design record
```

`ADR-MYO-001` is still `Proposed`. Until the required Phase 0 owner decisions
are recorded as accepted, engine implementation should not proceed beyond
document and target/claim freeze work.

## Source registry

The machine-readable source registry is
[`../../data/myocardium/sources.json`](../../data/myocardium/sources.json).
Only sources with `verificationStatus: "verified"` may be used for Phase A
equations, parameter fixtures, target packs, or acceptance thresholds.

The supporting source-registry note is
[references/myocardium-source-registry.md](references/myocardium-source-registry.md).

## Imported bundle checks

Revision 3's original markdown hashes are preserved in
[revision3-validation.json](revision3-validation.json). The repository import
status, source hashes, and adapted repository hashes are recorded in
[import-manifest.json](import-manifest.json).

[CHANGELOG-REV3.md](CHANGELOG-REV3.md) records the Revision 3 changes from the
source bundle.
