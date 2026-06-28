---
title: "ADR-STUDIO-001 — AI-native physiology studio MVP scope"
status: "Proposed"
date: "2026-06-28"
---

# ADR-STUDIO-001 — AI-native physiology studio MVP scope

## Context

The product direction is to evolve from a parameter-oriented simulator into an AI-native physiology studio where cases, interventions, PV loops, waveforms, explanations, and comparisons are integrated.

This direction is correct, but the full concept is too broad for the first implementation. Learn, Cases, Workbench, Create, Analyze, API, MCP, Community, Editor, and AI authoring must not all be implemented at once.

## Decision

Implement v0.1 as one strong case-centered workflow:

```text
Home
→ Cases
→ Case detail
→ Workbench
→ static Note interpretation
→ preview simulation or mock simulation
```

Do not implement Create, Analyze, API server, MCP server, Community, Book Studio, or full editor in v0.1.

## MVP objective

A user can select an official case, compare branches, inspect PV loops/waveforms/output metrics, and read a synchronized explanatory note.

## Initial screens

```text
/
/cases
/cases/:caseId
/cases/:caseId/run
/learn/pv-loop-basics
```

## Home policy

Home should not drop users directly into Workbench. It should guide them through official learning paths and official cases.

Home priorities:

1. Official Learning Path
2. Official Cases
3. Recently opened or recommended cases
4. Ask AI
5. Workbench shortcut for advanced users

Acceptance criteria:

- a first-time user can reach PV-loop basics, an AMI case, or Workbench within 30 seconds;
- AI intent box is not the only primary action;
- advanced users can reach Workbench in one click;
- Home does not show complex graphs.

## Workbench policy

Workbench must appear early. The first useful prototype may use mock or static outputs, but it must show the core branch-comparison loop:

```text
case branch selector
controller pane
PV loop / waveform pane
output metrics
note / teaching pane
parameter diff
```

## AI policy

LLM is not the source of truth.

```text
LLM proposes
Engine computes
Validator verifies
User accepts
```

Initial v0.1 may use a deterministic `intentRouter()` instead of a real LLM. Real LLM integration is later.

LLM-generated patches must include provenance:

```ts
source: "llm"
confidence?: number
requiresReview: true
```

They must not be applied without validation and user review.

## Note policy

Use a stable `NoteDocument` schema as the saved format. Do not persist BlockNote/Tiptap internal state as the product's canonical document format.

v0.1 uses static Note rendering only. Editing and BlockNote integration are later.

## Simulation policy

The simulation engine remains source of truth and must be separated from React/Next app code.

Recommended separation:

```text
src/domain
src/engine
src/app
```

or package-level equivalents.

Preview simulation should run off the UI thread when runtime load warrants it. UI may display health and limitations but must not hide validation boundaries.

## Model limitations

Each case must expose limitations and clinical caveats.

```ts
modelLimitations: string[]
clinicalCaveats: string[]
notMedicalAdvice: boolean
```

## Non-goals for v0.1

- Create / Case Studio
- Analyze workspace
- public API server
- MCP server
- Community publishing
- full note editor
- freeform pane layout editor
- LLM auto-application of patches

## Consequences

- v0.1 is smaller and validates the core value proposition earlier.
- AI-native direction remains, but AI is staged after deterministic UX is proven.
- The medical/scientific model remains governed by myocardium/morphology validation docs, not by product UX.
