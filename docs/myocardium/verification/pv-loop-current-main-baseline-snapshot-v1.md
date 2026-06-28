---
title: "PV-loop current-main baseline snapshot v1"
status: "Current baseline snapshot"
claim_boundary: "diagnostic-only-current-baseline-no-acceptance"
---

# PV-loop current-main baseline snapshot v1

## 1. Purpose

This snapshot records the post-PR #196 current-main PV-loop morphology
baseline. It preserves lightweight provenance, summary hashes, comparator
counts, and the current diagnostic interpretation boundary without committing
the large generated CSV/trace artifacts.

The snapshot is diagnostic context only. It accepts no root cause and no fix.
It authorizes no official morphology acceptance and no runtime replacement.
It tunes no qDot, valves, arterial load, Land parameters, official cases, or
UI display smoothing.

## 2. Provenance

Base commit:

```text
5aecda2d1b494aa74fe6c336dde13e8a585c8bf3
```

Canonical artifact root:

```text
artifacts/myocardium/pv-loop-morphology/current-main-baseline-2026-06-28
```

Runner command:

```bash
npx vite-node tools/myocardium/verifyPvLoopMorphologyQuality.ts --out=artifacts/myocardium/pv-loop-morphology/current-main-baseline-2026-06-28
```

Comparator commands:

```bash
npx vite-node tools/myocardium/buildFillingLimbDiagnosticComparator.ts --input=artifacts/myocardium/pv-loop-morphology/current-main-baseline-2026-06-28 --out=artifacts/myocardium/pv-loop-morphology/current-main-baseline-2026-06-28/filling-limb-diagnostic-comparator
npx vite-node tools/myocardium/buildArterialLoadZcReflectionDiagnosticComparator.ts --input=artifacts/myocardium/pv-loop-morphology/current-main-baseline-2026-06-28 --out=artifacts/myocardium/pv-loop-morphology/current-main-baseline-2026-06-28/arterial-load-zc-reflection-diagnostic-comparator
```

The generated `artifacts/` directory is intentionally ignored. Re-running the
commands above should be treated as artifact regeneration, not as a runtime or
model change.

## 3. Summary

The runner reported:

- cases: `normal-sinus`, `acute-anterior-mi`, `systolic-heart-failure`,
  `lv-failure-dobutamine`
- branch count: 7
- metric rows: 17304
- phase sample rows: 60572
- runner summary SHA-256:
  `054ab09984fb8b966bfd02941d8f5c7665ccfb6963c70133b660f8f9c8cc6de2`

The filling-limb comparator reported 42 groups and 12 interpretable groups.
Its current missing anti-gaming readout is `eaLikeInflowProxy`; that missingness
means many filling groups remain partially uninterpretable. It is not root-cause or fix acceptance.
Filling comparator summary SHA-256:
`d8864a70e6f00c29971c59a3003cbdf312f424169b1d718322b2a25ba69f4b9e`.

The arterial-load Zc/reflection comparator reported 42 groups and 42
interpretable groups. `characteristicImpedancePaSecPerM3`,
`arterialReflectionCoefficient`, and `arterialReflectionDelaySec` remain
`missing-no-proxy` with `proxyPolicy=forbidden`.
Arterial comparator summary SHA-256:
`c484b5d6d4445863a2066b459ec6012967c591adbdb28273b08f55fd8e5471c5`.

## 4. Diagnostic Interpretation

Current morphology hypotheses are supported correlations only:

- `aov-qdot-clamp-correlation`
- `filling-event-window-correlation`
- `rv-filling-valve-chatter-correlation`
- `sampling-or-display-sensitivity`

They are not root-cause or fix acceptance evidence, and they do not establish
an official morphology pass or myocardium acceptance evidence.

The current arterial evidence gap remains:

```text
ejection-limb-arterial-load-signal-gap
```

Root compliance and proximal pressure/flow signals are available, but Zc and
reflection are not modeled direct signals. They must not be inferred from
pressure, flow, resistance, inertance, compliance, root compliance, or waveform
shape.

## 5. Next Experiments

The next diagnostic experiments are:

1. Add or derive a diagnostic-only E/A-like inflow proxy before treating current
   LV filling comparator groups as fully interpretable.
2. Define and run an isolated arterial bench that emits direct Zc/reflection
   evidence rather than inferring those values from current waveform shape.
3. Feed only BLOCKER, ADVISORY, or OUT-OF-SCOPE-FOR-MYOCARDIUM morphology
   results to the myocardium roadmap.

## 6. Machine-Readable Snapshot

```text
data/myocardium/protocols/pv-loop-current-main-baseline-snapshot-v1.json
```

The verifier is:

```text
tools/myocardium/verifyPvLoopCurrentMainBaselineSnapshot.ts
```
