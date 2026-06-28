# Phase 5C-G Same-Closure Source-Provider Audit

Status: proposed audit snapshot after the Phase 5C-F triage gate and PR #193 lane handoff

This phase is a docs/data/verifier/test-only audit snapshot for the
`same-closure-source-provider-audit` lane introduced in Phase 5C-F. It records
the current live Phase 5C-C report values for the legacy activeStress positive
control and the Land 2017 new-myocardium run under the same surrogate closure.

Machine-readable audit:

```text
data/myocardium/gates/phase5c-same-closure-source-provider-audit-v1.json
```

Required verifier:

```text
npm run verify:myocardium-phase5c-same-closure-source-provider-audit
```

## Current Boundary

The Phase 5C-E entry state remains `entry-blocked-until-route-satisfied`.
The legacy activeStress positive control is still `positive-control-failed`,
`settled-period-1`, and `blocked-until-positive-control-period2`. The Land run
remains `not-interpretable-positive-control-failed`, and final no-alternans is
not claimed.

## PR #193 Handoff

PR #193 defines `modelcore-equivalent-closure-positive-control` as the proposed
next route. Phase 5C-G records that handoff as
`proposed-next-route-not-implemented` for this historical snapshot. This audit
does not implement a ModelCore-equivalent closure and does not satisfy the PR
#193 patch-plan route. Phase 5C-H later records the route as
`defined-not-satisfied` in the Phase 5C-E gate. Phase 5C-G only snapshots why
the existing surrogate closure remains an assay-fidelity no-go.

## Audit Contents

The audit records:

- same-closure hashes for closure config, initial state, and branch metric
  definitions;
- source provider provenance for `legacy-activeStress-positive-control` and
  `land2017-new-myocardium`;
- generated trajectory health and deterministic trajectory hashes;
- branch-window return-map status, period count, deltas, and beat hashes;
- event-surface summaries for pressure floor, TBV projection, reverse volume,
  and qDot cap status.

The verifier compares these fields against the live
`verify:myocardium-land-new-myocardium-low-preload-check` report and fails if
the audit drifts into period-2, pass, interpretable, or final no-alternans
claims. Platform-sensitive generated trajectory hashes, beat hashes, and peak
source-stress exact values are recorded as audit context, not cross-platform
acceptance pins.

## Non-Goals

This phase has no runtime replacement, no ModelCore/chamber/case/official-case/
Workbench/state-schema wiring, no ModelCore-equivalent closure implementation,
no qDot/valve/afterload tuning, no Land parameter tuning, no official
morphology acceptance, no final no-alternans, no RV pressure-overload coverage,
no ventricular interdependence coverage, no right-heart failure coverage, and
no TriSeg adoption.
