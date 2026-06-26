# Myocardium Revision 3

Status: Phase 0 owner decisions accepted
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

`ADR-MYO-001` is Accepted for the required Phase 0 owner decisions listed in
its acceptance clause. Phase 1A contract work and Phase 1B standalone Land
source equations may proceed, but ModelCore integration, calcium backends,
mechanics coupling, and runtime schema migration still require their later phase
gates.
The owner acceptance record carries `acceptedSourceType` and `acceptedSourceRef`
metadata so future decisions can trace the durable approval source.

## Source registry

The machine-readable source registry is
[`../../data/myocardium/sources.json`](../../data/myocardium/sources.json).
Only sources with `verificationStatus: "verified"` may be used for Phase A
equations, parameter fixtures, target packs, or acceptance thresholds.

The supporting source-registry note is
[references/myocardium-source-registry.md](references/myocardium-source-registry.md).

## Phase 0 artifact gate

Phase 0 artifact integrity is recorded in
[`../../data/myocardium/phase0-decisions.json`](../../data/myocardium/phase0-decisions.json)
and
[`../../data/myocardium/targets/claim-freeze-v1.json`](../../data/myocardium/targets/claim-freeze-v1.json).
Run `npm run verify:myocardium-phase0` to check the source registry, required
ADR-MYO-001 decision records, target/claim freeze categories, and pending owner
decisions. After `ADR-MYO-001` is marked Accepted, this gate expects the
required Phase 0 decisions to be individually accepted with owner provenance
metadata.

## Phase 1A contracts

Run `npm run verify:myocardium-contracts` to check the standalone Phase 1A
activation, provenance, instance-path, and dynamic-state-layout contracts. These
contracts live under `engine/myocardium/*`; the new
`engine/myocardium/state/StateLayoutBuilder.ts` reuses the existing
`engine/stateContract.ts` stable-hash helper only; it is not wired to legacy
`engine/core/stateLayout.ts`, ModelCore, chamber code, or runtime
schema/loaders. The spec §7.2 schema-breaking items, including
`MODEL_STATE_SCHEMA_VERSION` changes and old-loader rejection, are deferred to
later adoption/integration phases.
The activation contract distinguishes the scheduler family
`activation-scheduler-v1` from the concrete scheduler model
`periodic-activation-scheduler-v1`.

## Phase 1B Land source

Run `npm run verify:myocardium-land-source` to check the standalone Land 2017
source parameter provenance, BE residual/Jacobian smoke, no-projection output
semantics, PR 1B zero stabilization placeholder, absent PR 1C tangents, and
module import boundary.

## Imported bundle checks

Revision 3's original markdown hashes are preserved in
[revision3-validation.json](revision3-validation.json). The repository import
status, source hashes, and adapted repository hashes are recorded in
[import-manifest.json](import-manifest.json).

[CHANGELOG-REV3.md](CHANGELOG-REV3.md) records the Revision 3 changes from the
source bundle.
