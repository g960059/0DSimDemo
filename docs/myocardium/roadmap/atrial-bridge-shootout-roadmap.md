---
title: "Atrial bridge shootout — Phase 5.5 roadmap"
status: "Proposed"
date: "2026-06-27"
source_adr: "../adr/ADR-MYO-002-atrial-bridge.md"
---

# Atrial bridge shootout — Phase 5.5 roadmap

## 1. Rationale

The existing roadmap plans Phase 6 with a clean atrial elastance bridge. Observations show that a time-varying elastance atrial bridge can produce non-physiologic atrial PV-loop irregularity and blood-pressure wobble. The current RA/LA active-stress path can be a better comparator because it is stateful and can produce a smoother figure-eight atrial loop.

Therefore Phase 6 must be gated by a Phase 5.5 atrial bridge shootout.

## 2. Placement

```text
Phase 5: stable LV/RV local coupling and performance
Phase 5.5: atrial bridge shootout
Phase 6: LV/RV closed loop with selected validated atrial bridge
Phase 7: mechanistic atrial research
```

## 3. PR sequence

### PR 5.5A — atrial bridge contracts

Add documentation and future contract placeholders for:

- `AtrialBridgeInput`
- `AtrialBridgeOutput`
- `atrial-elastance-negative-control-v0`
- `legacy-atrial-active-bridge-v0`
- `atrial-reservoir-booster-bridge-v1`

No runtime behavior change required.

### PR 5.5B — shootout descriptors and target packs

Add or update:

```text
data/myocardium/protocols/atrial-bridge-shootout-phase5p5-protocols.json
data/myocardium/targets/atrial-bridge-targets-v1.json
data/myocardium/decisions/atrial-bridge-decision21-phase6-selection-v1.json
```

### PR 5.5C — verification script

Implement:

```text
npm run verify:myocardium-atrial-bridge-shootout
```

The script emits metrics only. It does not auto-select the bridge.

Status: implemented as part of the measured Phase 5.5 shootout result in
`data/myocardium/protocols/atrial-bridge-shootout-phase5p5-result-v1.json`.

### PR 5.5D — candidate implementation or wrappers

Implement or wrap:

```text
E0: atrial-elastance-negative-control-v0
A0: legacy-atrial-active-bridge-v0
A1: atrial-reservoir-booster-bridge-v1
```

A0 must be quarantined and cannot reintroduce old LV/RV active-stress behavior.

Status: implemented for the Phase 5.5 experiment as experimental LA/RA
provider wrappers only. No production atrial bridge wiring, official case
reauthoring, Workbench runtime wiring, state schema migration, atrial Land/RDQ
implementation, AF validation, or final atrial physiology claim is unlocked.

Measured result summary:

- E0/A0/A1 all ran under the same isolated LA/RA protocols and the same
  closed-loop smoke points.
- Normal, low-preload, and high-preload closed-loop smoke points settled for
  all candidates.
- High-HR reached the 120 s cap for all candidates.
- A1 preserved booster/A-loop structure and did not worsen qDot clamp fraction
  relative to A0, but it worsened valve diode hit counts versus A0 in at least
  one smoke point, did not pass the settled-point atrial loop repeatability
  gate, and did not show sampling-invariant isolated roughness ordering.
- No recommendation is made while the high-HR common non-settle gap and A1
  blocker set remain.
- The result is recommendation-only; owner selection remains separate.

### PR 5.5E — owner decision

Owner records selected Phase 6 bridge in:

```text
data/myocardium/decisions/atrial-bridge-decision21-phase6-selection-v1.json
```

## 4. Phase 6 modification

Replace the previous Phase 6 statement:

```text
LA/RA: clean atrial elastance bridge
```

with:

```text
LA/RA: selected validated atrial bridge
```

The selected bridge may be A1 or, if justified, A0 as a temporary fallback. E0 requires explicit owner override and a new ADR update.

## 5. Future atrial research

Phase 7 remains responsible for mechanistic atrial myocardium:

```text
legacy active-stress atria baseline
→ AtrialReservoirBoosterBridgeV1
→ LandAtrialV1
→ RDQAtrialV1 if LandAtrialV1 fails defined atrial targets
```

Do not start Land/RDQ atrial implementation until the bridge shootout quantifies what the current RA/LA active-stress path is doing well.

## 6. Completion criteria

Phase 5.5 is complete when:

- E0/A0/A1 metrics are reported under the same protocols;
- PV-loop roughness and high-frequency pressure metrics are computed;
- qDot/valve event contamination is reported;
- a Phase 6 bridge recommendation is produced;
- owner selection remains explicit and separate from the script output.

Current completion status:

- metrics, roughness, high-frequency energy, qDot/valve contamination, and
  settle status are reported;
- Phase 6 bridge recommendation is intentionally withheld because high-HR does
  not settle for any candidate and A1 has valve-event contamination,
  repeatability, and sampling-invariance blockers;
- Decision 21 remains `PENDING_OWNER`.
