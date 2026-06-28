# Morphology-to-myocardium handshake

Status: proposed integration contract  
Scope: evidence handoff only; no runtime/model/solver change

## Objective

Define how morphology evidence affects myocardium development without blurring ownership.

The morphology lane may report that a PV-loop or waveform artifact contaminates a myocardium interpretation. The myocardium lane remains responsible for Land/source-stress/coupling interpretation and for any no-alternans or runtime-replacement claim.

## Lane responsibilities

| Lane | Owns | Must not claim |
|---|---|---|
| Morphology | PV-loop phase segmentation, roughness, squareness, incisura, valve/qDot/clamp/event correlation, sampling robustness | Land correctness, source-stress scale, runtime replacement, official morphology pass |
| Myocardium | Land, source stress, local coupling, SDIRK2 reference, positive-control closure, no-alternans interpretation | PV-loop root cause without morphology evidence, hidden morphology tuning |
| Atrial bridge | LA/RA bridge candidate comparison and Phase 5.5 shootout | final atrial physiology, AF validation, atrial Land/RDQ validation |
| Arterial load | Zc/root/reflection candidate signals and comparators | myocardium source-stress failure or success |
| Studio/product | case/workbench/note UX | scientific acceptance or model validation |

## Evidence classes

### BLOCKER

Use when the morphology result makes a myocardium claim unsafe.

Examples:

- a low-preload branch overlaps qDot or valve event surfaces;
- a morphology improvement coincides with output suppression;
- a candidate passes only under resampled data, not raw data;
- filling-limb roughness is dominated by atrial bridge or valve clamp events.

Effect:

```text
myocardium interpretation must pause or downgrade its claim
```

### ADVISORY

Use when the issue is visible but does not block the current claim.

Example:

```text
PV loop ejection limb remains boxy, but the current myocardium PR only claims
source-equation readiness, not loaded morphology acceptance.
```

Effect:

```text
record and route to the responsible future lane
```

### OUT-OF-SCOPE-FOR-MYOCARDIUM

Use when the issue should not be corrected by fitting Land or source stress.

Examples:

- Zc/reflection unavailable;
- AoP incisura signal gap;
- valve closure artifact;
- atrial bridge PV-loop roughness.

Effect:

```text
myocardium must not tune parameters to hide it
```

## Required handoff schema

```json
{
  "schemaVersion": 1,
  "handoffId": "string",
  "sourceLane": "morphology",
  "targetLane": "myocardium|atrial-bridge|arterial-load|studio",
  "class": "BLOCKER|ADVISORY|OUT_OF_SCOPE_FOR_MYOCARDIUM",
  "caseId": "string",
  "branchId": "string",
  "chamber": "LV|RV|LA|RA|multi|unknown",
  "phaseLabel": "filling|ejection|isovolumic|closed-loop|unknown",
  "metricId": "string",
  "metricValue": null,
  "comparisonTarget": "string|null",
  "confidence": "low|medium|high",
  "suspectedLane": "myocardium|atrial-bridge|arterial-load|valve-qdot|sampling|unknown",
  "claimBoundary": "string",
  "nextRecommendedExperiment": "string",
  "artifactPaths": []
}
```

## Myocardium gate consumption

A myocardium PR may use morphology evidence in three ways:

1. **Blocker acknowledgement**: claim is downgraded or blocked.
2. **Boundary evidence**: claim remains valid because it is explicitly outside loaded morphology.
3. **Acceptance support**: only allowed when the myocardium gate itself also passes.

Morphology evidence alone cannot produce myocardium acceptance.

## Phase 5C special rule

For low-preload alternans, the current required route is:

```text
positive-control closure first
morphology classification second
Land/no-alternans interpretation last
```

A Land run may not claim no-alternans merely because morphology metrics look stable under a closure that fails the legacy positive control.

## Arterial-load special rule

Zc/reflection claims require direct signals or an isolated arterial bench.

Do not infer Zc or reflection coefficient from existing production waveform proxies alone.

## Studio/product special rule

Studio UI may surface morphology and myocardium claim boundaries, but it must not convert diagnostic evidence into scientific acceptance.
