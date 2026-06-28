# AI-native physiology studio MVP roadmap

Status: proposed
Scope: product/studio planning only; no runtime/model validation change

## MVP goal

Build one strong experience:

> Select an official case, compare branches, inspect PV loop/waveform/output metrics, and read a synchronized explanatory note.

Do not start with Create, Analyze, API, MCP, Community, or full editor workflows.

## PR sequence

### PR S1 — foundation + home + static data

- app shell
- domain schema
- static official cases
- static learning path
- Home
- Case Explorer
- Case Detail
- no solver required

### PR S2 — Workbench static/mock

- `/cases/:caseId/run`
- fixed template Workbench
- branch selector
- controller pane
- PV loop mock
- waveform mock
- output metrics mock
- note pane
- parameter diff

This PR validates the core user experience before engine integration.

### PR S3 — preview engine integration

- connect existing preview engine behind a stable adapter
- controller → ParameterPatch → engine
- SimulationResult generation
- GraphPane drawing
- Output metrics
- SimulationHealth display

Do not mix engine code into React components.

### PR S4 — lesson sync

- NoteDocument renderer
- GraphRefBlock
- ControllerRefBlock
- selected beat/time sync
- static lesson pages

### PR S5 — deterministic AI intent router

- no external LLM required
- route common intents to official cases/lessons/workbench actions
- e.g. AMI, RV, PEEP, PV loop, dobutamine

### PR S6 — real LLM integration

- case draft suggestions
- note draft suggestions
- graph/controller recommendations
- patch review UI
- validation and user approval required

## Defer until after v0.1

```text
Create / Case Studio
Analyze workspace
API server
MCP server
Community publishing
BlockNote editor
freeform layout editor
auth/backend/community features
```

## Case schema additions

```ts
export type CaseSpec = {
  modelLimitations: string[];
  clinicalCaveats: string[];
  notMedicalAdvice: boolean;
  primaryConcepts: string[];
  prerequisiteConcepts?: string[];
  recommendedGraphs: GraphKind[];
  recommendedControllers: string[];
  defaultBranchId: string;
};
```

## Branch schema additions

```ts
export type ScenarioBranch = {
  hypothesis?: string;
  expectedFindings?: string[];
  teachingPoints?: string[];
};
```

## Pane policy

v0.1 is template-only. Do not implement arbitrary drag/resize layout yet.

```ts
type TemplateId =
  | "case-overview"
  | "pv-loop-comparison"
  | "shock-workbench"
  | "valve-workbench";
```

## AI safety policy

```text
LLM proposes
Engine computes
Validator verifies
User accepts
```

LLM patches require:

```ts
source: "llm";
requiresReview: true;
confidence?: number;
```

## Model limitation policy

The UI must surface model limitations and clinical caveats from the case specification. Studio UX must not convert a model diagnostic or morphology correlation into scientific acceptance.
