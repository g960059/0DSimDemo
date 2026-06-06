[日本語](./README.md) | **English**

# CircleHeart

**CircleHeart** is a **0D closed-loop cardiovascular hemodynamics workbench** for research and teaching.
Rather than just a tool for nudging numeric parameters, it is designed as a *physiology workbench* where you read and compare **cases, interventions, waveforms, PV loops, metrics, and explanatory notes** side by side on a single screen.

It models active-stress cardiac chambers, dynamically opening/closing valves, systemic and pulmonary windkessel trees, ventricular interaction through pericardium and septum, and a 3-territory coronary bed — integrated with a fixed-step explicit Runge–Kutta scheme (2nd-order Heun's method) and a mass-conservative total-blood-volume (TBV) ledger.

The primary audience is researchers in cardiovascular modeling, 0D simulation, biomedical engineering, and anesthesia/cardiology. Clinical users who want to learn hemodynamics — residents, clinical engineers, and others — can start from the official lessons and official cases.

---

## Important: research & education only

**CircleHeart is not a medical device.**
Do not use it for diagnosis, treatment decisions, patient-specific prediction, or drug-dosing decisions.

This repository implements a 0D lumped-parameter model. Heart, vessels, valves, and the coronary circulation are represented as a network of nodes and edges with no spatial extent. As a result, it cannot represent:

- regional wall-motion abnormality as such
- 3D blood flow, vortices, jets, or local shear stress
- patient-specific morphology or tissue properties
- detailed autonomic reflexes, renal/hepatic/endocrine systems, or fluid shifts
- validated patient prediction against real clinical data

What this project prioritizes is not exact agreement on absolute values, but **waveform shape, how PV loops change, the direction of the response to an intervention, and how the model looks when it breaks down.** Numbers are *things to be calibrated and validated*, not fixed physiological constants.

These limitations are also surfaced in-app (a first-run modal; see [`components/ModelLimitations.tsx`](components/ModelLimitations.tsx)) and attached to every official case.

---

## What this project does

CircleHeart is currently organized roughly into the following five layers.

| Layer | Role |
|---|---|
| **Workbench** | The working screen where you lay out multiple circulatory states and view waveforms, PV loops, metrics, notes, and controllers at once |
| **Official Cases** | Official cases such as normal, AMI, HFrEF, HFpEF, AS, and hypovolemic shock |
| **Lessons** | Interactive lessons that teach how to read waveforms and PV loops step by step, using the official cases |
| **Simulation engine** | The 0D closed-loop circulation model itself — decoupled from React and driven by the `PreviewController` / harness |
| **Research docs / tests** | Records of literature grounding, parameter validity, waveform morphology gates, baseline freezes, and steady-state verification |

---

## Intended use

### 1. For researchers

For researchers, the intended uses include:

- comparing active-stress chamber models with time-varying-elastance models
- inspecting dynamic valve opening/closing, stenosis/regurgitation, and orifice losses
- perturbing systemic/pulmonary resistance, compliance, venous capacity, and TBV
- studying left–right ventricular interaction via pericardial pressure and septal coupling
- checking the 3-territory (LAD / LCx / RCA) coronary model and FFR-like indices
- verifying whether official-case outputs are physiologically plausible
- baseline freeze and regression testing before moving on to calibration / validation / UQ

Because the engine is decoupled from the UI, you can run scenarios headlessly from [`engine/harness.ts`](engine/harness.ts) and obtain measured values, waveform samples, health, and TBV drift (see [Headless runs](#headless-runs-for-researchers)).

### 2. For clinical users

Clinical users are best served by starting from the official lessons and official cases.

- read LVP / AoP / LAP and the PV loop of a normal heart
- see why the PV loop becomes low and narrow in acute anterior MI
- compare HFrEF and HFpEF across waveforms, PV loops, and metrics
- see why an LV–Ao pressure gradient arises in AS
- watch how preload falls and SV and CO drop in hypovolemic shock

Use it not as a clinical decision-support tool, but as an **educational and research model for reading, manipulating, and comparing hemodynamics.**

---

## Application structure

| Route | Screen | Contents |
|---|---|---|
| `/` | Home | Entry point to official lessons, official cases, and the Workbench |
| `/cases` | Cases | List of official cases, your own cases, and public cases |
| `/lesson/:id` | Lesson | Interactive lesson built around an official case |
| `/workbench` | Workbench | An empty simulation working screen |
| `/workbench/:caseId` | Case Workbench | Opens an official or saved case in the Workbench |

The Workbench is the current core. There you lay out multiple simulation instances and compare them through shared waveform panes, PV loops, metrics, controls, and notes.

---

## Official cases

| Case id | Display name | Main teaching point |
|---|---|---|
| `normal-sinus` | Normal physiology | Reference operating point of a normal adult |
| `acute-anterior-mi` | Acute Anterior MI | Low output from reduced contractility, elevated LAP, shrunken PV loop |
| `systolic-heart-failure` | Systolic Heart Failure (HFrEF) | Low contractility, reduced SV/CO, elevated filling pressure |
| `diastolic-heart-failure` | Diastolic Heart Failure (HFpEF) | Stiff LV, impaired relaxation, elevated filling pressure with preserved EF |
| `aortic-stenosis` | Aortic Stenosis | LV–Ao gradient and a high-pressure PV loop from valvular stenosis |
| `hypovolemic-shock` | Hypovolemic Shock | Low preload, low SV/CO, low-pressure waveforms |
| `lv-failure-dobutamine` | Cardiogenic shock: LV failure ± dobutamine | Comparison of LV failure vs. recovery direction under β1 stimulation |
| `valve-lesions` | Valvular lesions | Comparison of AS and MR |
| `hypovolemia` | Hypovolemia | A static reduced-blood-volume model |

Each official case is defined statically as a `CaseDocument` in [`officialCases.ts`](officialCases.ts). A case includes instances, clinical knobs, interventions, panel layout, and notes where applicable.

---

## Official lessons

| Lesson id | Display name | Purpose |
|---|---|---|
| `normal-reference` | Normal Physiology Reference | How to read normal waveforms, PV loops, metrics, and controls |
| `acute-anterior-mi` | Acute Anterior MI | How reduced contractility affects the PV loop and CO |
| `systolic-heart-failure` | Systolic Heart Failure (HFrEF) | HFrEF waveforms, PV loops, and metrics |
| `diastolic-heart-failure` | Diastolic Heart Failure (HFpEF) | HFpEF filling-pressure elevation and PV loop |
| `aortic-stenosis` | Aortic Stenosis | Valvular pressure gradient and LV load |
| `hypovolemic-shock` | Hypovolemic Shock | Preload reduction from decreased blood volume |

A lesson walks you through the notes of an official case while you observe the same case in the Workbench. In addition, each step can **expose a limited set of knobs (exposed knobs) that the learner can actually adjust** ([`components/LessonPlayer.tsx`](components/LessonPlayer.tsx)), so you can see on the spot how the waveforms and PV loop respond. Moving to another step automatically resets any adjusted knobs to their initial values.

---

## How to read the Workbench

The Workbench is a model-exploration screen for researchers and a waveform-reading screen for clinical users.

The main panes are:

| Pane | Contents |
|---|---|
| **Scenarios** | Display, compare, and switch between multiple simulation instances |
| **Controls** | Operate clinical knobs and some raw parameters |
| **Waveforms** | Time series of pressures, flows, valve states, coronary, and pericardial/septal signals |
| **PV Loop** | Pressure–volume relationships for LV / RV / LA / RA |
| **Metrics** | ABP, CVP, PAP, PCWP, SV, CO, EF, coronary indices, etc. |
| **Notes** | Case explanation, model limitations, teaching memos |

Researchers can track raw parameters, but ordinary cases and educational content favor **clinical knobs** over raw parameters — this keeps case saving, sharing, and future version migration stable.

---

## Simulation model overview

The current engine represents the 0D closed-loop circulation as nodes and edges. State variables use the following units: pressure in mmHg, volume in mL, flow in mL/s, time in s, and elastance in mmHg/mL.

### Chambers

- LV / RV / LA / RA are chamber nodes.
- The default is a **single-fibre / active-stress** formulation.
- A **time-varying-elastance** formulation is retained as an alternative mode.
- In the active-stress model, contraction, relaxation, passive pressure, Tmax scale, and so on exist as raw parameters.

### Valves

- MV / AoV / TV / PV are modeled as dynamic edges.
- The valve opening `xi` has finite opening/closing time constants.
- Stenosis, regurgitation, resistance, inertance, and second-order losses are handled.
- Tests verify not only that `xi` is clamped to 0–1, but that each valve actually opens and closes.

### Systemic / pulmonary circulation

- Systemic: Ao, SA, Art, Cap, SV, VC
- Pulmonary: PA, PArt, PCap, PVen, PVein
- Some arterial/venous compartments include nonlinear capacitance, collapse/open/stiff regimes, and external pressure.
- Total blood volume (TBV) is tracked as a ledger, kept consistent with the fluid/hemorrhage models.

### Pericardium / septum

- Pericardial pressure and inter-ventricular interaction are modeled.
- Septal displacement affects the effective volume and pressure generation of LV/RV.
- This is currently a lightweight inter-ventricular coupling for a 0D workbench, not TriSeg itself.

### Coronary circulation

- A 3-territory model (LAD / LCx / RCA).
- Intramyocardial pressure, coronary stenosis, coronary flow, and an FFR-like index are handled.
- The coronary circulation is a 0D representation for teaching and exploration — it does not represent a detailed coronary tree or regional ischemia.

### Numerical integration

- The preview engine uses a fixed-step explicit Runge–Kutta scheme (2nd-order Heun's method) (see [`engine/ModelCore.ts`](engine/ModelCore.ts)).
- The default `dt` is 0.001 s.
- In the Workbench, the `PreviewController` manages the simulation core, sample buffer, health, and steady transitions.
- In the browser it prefers a Web Worker and falls back to synchronous execution where one is unavailable.

---

## Headless runs (for researchers)

Because the engine is independent of the UI, you can run a scenario headlessly with `runScenario` from [`engine/harness.ts`](engine/harness.ts) and obtain measured values, health, and mass-conservation drift.

```ts
import { runScenario } from "@/engine/harness";

// Define a scenario as a partial set of raw params and settle to the true limit cycle before measuring.
const result = runScenario(
  { /* partial CoreRuntimeParams */ },
  { settleMode: "converge", measureSeconds: 30 },
);

// For grounded measurements, confirm `settled` before trusting the values.
if (result.settleStatus?.settled) {
  console.log(result.metrics);        // SV, CO, EF, pressure indices, etc.
  console.log(result.health);         // simulation health status
  console.log(result.driftPctPer60s); // TBV mass-conservation drift (%/60s)
}
```

`settleMode: "fixed"` is the baseline-freeze path (a byte-stable change detector) and runs for a fixed number of seconds. `settleMode: "converge"`, on the other hand, uses the steady-state detector to converge to the true periodic steady state and returns `settleStatus`. For grounded measurements — e.g. comparison against literature values — always confirm convergence with `converge` before reading the values.

To run from clinical knobs, convert them to raw params via the mapping in [`engine/knobs.ts`](engine/knobs.ts) before passing them to `runScenario`.

---

## Clinical knobs and raw parameters

This project defines **clinical knobs** as the operating vocabulary shown directly to users.

Examples:

- HR
- contractility / contractilityRV
- relaxation
- diastolicStiffness
- afterload
- arterialStiffness
- pulmonaryResistance
- venousTone
- PEEP
- valve-lesion severities such as aorticStenosis / mitralRegurgitation

Clinical knobs are mapped to raw parameters. This mapping is versioned by `knobMappingVersion` (currently `knobmap-0.3-activestress`), and saved cases are resolved against the mapping version they were authored with. An unknown mapping version fails explicitly rather than falling back silently.

This policy preserves case reproducibility. Instead of saving and sharing raw parameters directly, the project saves, as a rule, "operations with clinical meaning" and a "reference baseline."

---

## CaseDocument: the unit of saving and sharing

Workbench state is saved as a `CaseDocument`, defined in [`caseDoc.ts`](caseDoc.ts).

A `CaseDocument` contains:

- schemaVersion / engineVersion / knobMappingVersion
- solver config
- meta information
- case spec
- simulation instances
- panel layout / workspace layout
- notes
- reading / lesson layer
- exposed controllers

The important point is that **`modelLimitations` is mandatory for any displayable case.** A case is not merely a parameter set but an educational/research document that includes "what to show" and "what limitations it carries."

---

## Verification and regression tests

This repository does not try to "prove the model correct all at once." Instead it separates correctness into at least three levels:

1. **Numerical safety**: no NaN/Inf, finite state, no integration blow-up
2. **Invariants**: TBV drift, left–right flow balance, valve opening/closing, clamp hits, health status
3. **Physiology morphology**: PV loop, E/A, LA/RA figure-eight, PVF S/D/Ar, low regurgitation at normal valves

The baseline freeze in `baseline.test.ts` is a change detector for current behavior. It is not a claim of "fully physiologically valid" — it is a fixed point for catching unintended behavioral changes.

Research-level validity is updated through the literature-based records under `docs/research/` and through future calibration / validation / UQ.

---

## Literature & validity documentation

[`docs/research/README.md`](docs/research/README.md) is the entry point for parameter validity, literature grounding, and calibration records.

This directory follows these rules:

- cite only real literature
- do not fabricate DOIs, page numbers, or quotations
- verify numbers either by recomputing in code or by cross-checking between two parties
- keep literature target values, model values, verdicts, and open questions separate
- state units explicitly
- prioritize waveform shape and direction of change over absolute values

The main subjects are EDPVR, active stress, arterial/venous compartments, valves, pericardium/septum, the Guyton/Starling pane, the coronary circulation, waveform morphology, and case validity. The model geometry and EDPVR derivations are collected in [`docs/research/derivations-geometry-and-edpvr.md`](docs/research/derivations-geometry-and-edpvr.md).

---

## Setup

### Prerequisites

- Node.js LTS
- npm

### Install

```bash
npm install
```

### Dev server

```bash
npm run dev
```

The Vite dev server starts by default at:

```text
http://localhost:3000
```

### Build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | TypeScript check and production build |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run the Vitest suite (excluding the Firestore emulator test) |
| `npm run test:rules` | Run the Firestore rules emulator test |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run verify:baseline` | Run the baseline verification script |
| `npm run fit:left-filling` | Fitting tool for left-heart filling |
| `npm run fit:right-pvf-headroom` | Fitting tool for right-heart / PVF headroom |

---

## Tech stack

- React 19 / react-router-dom 7
- TypeScript
- Vite 6
- Tailwind CSS 4
- D3 / Recharts
- dockview
- BlockNote
- KaTeX / react-katex
- lucide-react
- Firebase / Firestore
- Vitest

The current Workbench layout uses a dockview-based composition. Statements assuming `react-grid-layout` in older READMEs or design notes do not match the current implementation.

---

## Project structure

```text
engine/
  ModelCore.ts              the 0D circulation model itself
  protocol.ts               raw parameter schema, clamps, metrics, health
  knobs.ts                  clinical knob -> raw parameter mapping
  harness.ts                headless scenario runner
  previewController.ts      preview driver for the Workbench
  chambers.ts               active-stress / elastance chamber model
  mechanics/                pericardium, septum
  fitting/                  calibration / objective utilities
  verification/             verification report utilities

components/
  Home.tsx                  Home
  Cases.tsx                 case explorer
  LessonPlayer.tsx          interactive lesson (exposed knobs)
  reading/                  lesson reading mode
  workbench/                Workbench panes, dockview, settings
  HealthIndicators.tsx      simulation health UX
  ModelLimitations.tsx      model limitation UI

caseDoc.ts                  CaseDocument schema and conversion
caseCloud.ts                Firestore case persistence
casePersist.ts              local import/export/persistence
lessonDoc.ts                official lesson definitions
officialCases.ts            official case definitions
constants.ts                app-level default params

docs/research/              parameter validity, calibration, morphology docs
__tests__/                  app / case / reading tests
engine/__tests__/           engine regression and morphology tests
tools/                      verification / fitting scripts
```

---

## Contributing

This project prioritizes **model reproducibility, verifiability, and explainability** over cosmetic refactors.

When making changes, at minimum confirm:

```bash
npm run test
```

When changing the model or parameters, make the following explicit:

- which physiological problem it fixes
- which literature, measurement, or benchmark it is based on
- which waveform / PV loop / metric improves
- which cases are affected
- whether the baseline freeze needs updating
- whether anything should be added to the model limitations

When adding cases or lessons, always write model limitations. The more clinical a UI looks, the more it must state how far it can be trusted.

---

## Current status

CircleHeart is no longer a mere UI mock: it is a working prototype with active-stress chambers, dynamic valves, systemic/pulmonary networks, pericardial/septal coupling, the coronary circulation, a TBV ledger, official cases, lessons, the Workbench, case persistence, and health / morphology tests.

At the same time, it is not yet a validated simulator.

The key themes going forward are not feature additions per se, but:

- calibration
- validation
- uncertainty quantification
- stabilizing the steady-state / transition-state contract
- separating the roles of the preview engine and an accurate engine
- per-case validity review
- continuous updates to literature grounding and model limitations

This README is intended to describe, without overstating the current implementation, where the project stands as a research and education workbench.

---

## License and citation

There is currently no `LICENSE` file in the repository. **Until a licensing policy is settled, the terms for reusing this code are undefined.** If you are considering reuse, please check with the maintainer before use.

When referring to this project in a research context, please cite the specific commit hash (revision) you used. CircleHeart is not yet a validated simulator, and its behavior can change from revision to revision.
