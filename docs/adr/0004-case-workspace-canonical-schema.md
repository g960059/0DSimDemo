# ADR-0004: Canonical case workspace schema

## Status

Accepted.

## Context

The product goal is to let a user or MCP/API/LLM prompt create an educational scene such as "explain the difference between normal and AMI", producing a physiology comparison, PV loop, output strip, and generated note. That requires a durable document model that is meaningful without a particular UI layout library.

The existing `CaseDocument` is already knob-primary and portable, but `PanelDef` still carries grid geometry and UI flags from the current workbench. Firestore rules also had a legacy `cases/{caseId}` shape with an `initialState` string, while lessons lived in a separate `lessons/{lessonId}` document model.

## Decision

Use top-level `cases/{caseId}` as the canonical cloud document for community cases, official cases, prompt-generated cases, and lessons.

`CaseDocument` remains the canonical content and now carries:

- `kind`: `case | lesson | promptGenerated`
- `ownerId`, `status`, `visibility`, `source`, and `derivedFrom`
- `instances`: knob-primary physiology specs with optional provenance source
- `panels`: semantic panel definitions, preserving legacy `config` while allowing typed `view`
- `workspace`: semantic region state for scenarios, controls, graph, output, and notes
- optional `lesson`: lesson/note spine and stage sequence

Firestore stores a small metadata wrapper plus serialized `content`. Top-level metadata (`title`, `description`, `kind`, `status`, `visibility`, owner/version fields) supports listing and rules. `content` preserves the full versioned `CaseDocument`.

Dockview or any future layout-library state is not the canonical model. If needed, it is stored as optional zone-specific `workspace.viewStates` and can be regenerated from the semantic workspace.

## Consequences

- `/workbench/:caseId` becomes the canonical route. The old `/workbench?case=` path remains a compatibility loader.
- `/lesson/:caseId` can read a `CaseDocument.lesson` layer from `cases/{caseId}`; legacy `lessons/{lessonId}` stays as fallback during migration.
- Community cases use one top-level collection with `ownerId`, not nested `users/{uid}/cases`.
- LLM/MCP/API callers should emit semantic operations such as add graph panel, show note, choose baseline/official instance, and set workspace mode rather than raw dock layout JSON.
- Existing saved files remain compatible because `PanelDef.config` is preserved. Typed `PanelDef.view` is additive.

## Alternatives considered

- Store Dockview JSON as the canonical layout. Rejected because it is hard for LLM/API callers, mobile views, migrations, and semantic validation.
- Keep lessons as a separate top-level canonical collection. Rejected as the long-term model because it creates duplicate sources for share/remix/community flows. It remains as a migration fallback.
- Store user cases under `users/{uid}/cases/{caseId}`. Rejected because public discovery, remixes, and stable URLs are simpler with top-level `cases/{caseId}`.
