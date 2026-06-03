[日本語](./README.md) | **English**

# HemoSim 0D

> A browser-based **0D closed-loop cardiovascular hemodynamics simulator** for modeling and teaching — active-stress cardiac chambers, dynamic valves, systemic + pulmonary windkessel trees, pericardial/septal coupling, and a 3-territory coronary bed, integrated with an explicit RK solver and a mass-conservative total-blood-volume ledger.

---

## ⚠️ Disclaimer — research & education only

**HemoSim 0D is not a medical device.** It is built for modeling, teaching, and exploration, and must **not** be used for diagnosis, treatment, or any patient-specific clinical decision.

- It is a **0D lumped-parameter model**: it does not resolve spatial blood flow, local wall stress, or 3D hemodynamics.
- **Parameters are calibration targets, not fixed physiological constants.** Outputs are approximate and have **not been validated against clinical data**.
- Several subsystems are **not modeled** (e.g. renal/hepatic/portal beds, detailed baroreflex, fluid exchange).
- Use it to **build intuition and explore hypotheses** — not to predict a specific patient.

These limitations are surfaced in-app (a first-run modal, see `components/ModelLimitations.tsx`) and attached to every official case.

---

## Table of contents

- [What it is](#what-it-is)
- [The model](#the-model)
- [For researchers](#for-researchers)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Calibration stance & physiology](#calibration-stance--physiology)
- [Contributing](#contributing)
- [License](#license)

---

## What it is

HemoSim 0D is a real-time simulator of the closed-loop cardiovascular system, implemented as a 0D lumped-parameter network and integrated with an explicit Runge–Kutta solver. It runs entirely in the browser, with a clean separation between the **simulation engine** (`engine/`) and the **UI** (`components/`).

You perturb the circulation with **physiology knobs** (contractility, afterload, heart rate, valve lesions, fluids/hemorrhage, ventilation/PEEP, …) and observe the response through several synchronized views — **waveforms**, **pressure–volume loops**, a **Guyton/Starling operating map**, and a **coronary** pane (pressures, flows, FFR). The model is the core; on top of the simulator sit an **authored interactive-lesson system** and a set of curated **official cases**, so the same engine serves both modeling/exploration and structured teaching.

Pathological and abnormal regimes are a primary use case. The model is tuned **shape-first**: waveform morphology and the *direction* of change under a perturbation are prioritized over matching exact absolute values (see [Calibration stance](#calibration-stance--physiology)).

---

## The model

A 0D closed-loop lumped-parameter cardiovascular model:

- **Active-stress cardiac chambers** (LV, RV, LA, RA) — wall-mechanics chambers with an active-stress generator, plus an alternative **time-varying elastance** mode.
- **Dynamic valves** (MV / AoV / TV / PV) with finite opening/closing dynamics and lesion support (stenosis / regurgitation: AS / MR / AR / TR).
- **Systemic and pulmonary trees** — windkessel-style arterial/venous compartments (compliances, resistances, inertances).
- **Pericardial pressure + septal (ventricular-interaction) coupling** (`engine/mechanics/pericardium.ts`, `engine/mechanics/septum.ts`).
- **3-territory coronary bed** (LAD / LCx / RCA) with intramyocardial compression, stenosis, and FFR.
- **Mass-conservative** closed loop, with a **total-blood-volume (TBV) ledger** driving fluid loading / hemorrhage and a conservative venous-pressure corrector.

The model state is advanced by an **explicit fixed-step Runge–Kutta integrator** — specifically **Heun's method** (RK2 predictor–corrector: an Euler predictor, a state sanitize, then a trapezoidal corrector; `engine/ModelCore.ts`). Integration is deterministic for a given `dt`/platform. The default scenario step is `dt = 1e-3 s`. The model definition and the knob/parameter contract live in **`engine/ModelCore.ts`** and **`engine/protocol.ts`**; the latter also enforces integrator-safe parameter clamps before any state is advanced.

---

## For researchers

- **Engine ↔ UI separation.** All physics lives in `engine/` and is independent of React; the UI is a consumer. You can drive the model headlessly.
- **Headless scenario harness.** `engine/harness.ts` exposes `runScenario(params, options) → ScenarioResult`. It constructs a `ModelCore`, seeds venous pressures to a target TBV, settles to (fixed-long-run or convergence-detected) steady state, runs a measurement window, and returns the `core`, `metrics`, `health`, the recorded `samples`, TBV at window start/end, and a mass-conservation `driftPctPer60s`. Options cover `targetTBV`, `settleSeconds` / `settleMode` (`"fixed"` | `"converge"`), `measureSeconds`, `dt`, and `sampleHz` (defaults in `BASELINE_OPTIONS`: TBV 5600, 60 s settle, 30 s measure, `dt` 1e-3, 120 Hz). Helpers `recordValveExtremes()` (proves valves actually open *and* close over a window) and `summarize()` (a rounded change-detection snapshot) are also exported. `ModelCore` itself exposes `step()`, `runFor()`, `settleToSteady()`, `metrics()`, and `health()` for custom drivers.
- **Observability.** Pressures, flows, ventricular and atrial PV loops, the Guyton/Starling venous-return / cardiac-function operating map, and coronary territory flow / FFR are all first-class outputs.
- **Mass conservation.** The TBV ledger and conservative venous-pressure correction make the loop mass-conservative; `driftPctPer60s` reports residual integrator drift over the measured window so you can audit conservation directly.
- **Reproducible gates.** The Vitest suite includes baseline snapshot freezes and **waveform-morphology gates** (PV-loop shape, mitral inflow E/A, atrial figure-8 loops, …) so behavioral changes are caught as regressions.
- **Literature-grounded parameter-validity navigator.** [`docs/research/README.md`](docs/research/README.md) is the model's evidence base. It traces every parameter group — chamber geometry / EDPVR (Klotz), active-stress ceilings, arterial/venous nodes, edge R/L → SVR/PVR, valve EROA, pericardial/septal coupling, the Guyton/Starling pane, coronary circulation, waveform morphology, atrial AV-plane reservoir, and the per-case validity reviews — to a **canonical literature source** (Klabunde, Guyton & Hall, Suga/Sagawa, Sunagawa, Burkhoff, Westerhof/Stergiopulos, Garcia/Otto, CircAdapt, Klotz, Carlsson/Arheden, …). Its ground rules are strict: **real references only** (no fabricated citations/DOIs/pages), **code-verified or two-party cross-checked numbers**, explicit units, and an **honest open-question ledger** that separates literature target from model value from verdict.

---

## Features

### Simulation / Workbench
- Live, real-time **waveforms** (e.g. LV/aortic/atrial pressures, flows) updated as you turn knobs.
- **Pressure–volume loops** for the ventricles, plus the atrial **figure-8** loop.
- **Guyton / Starling operating map** — venous-return / cardiac-function pane to reason about preload and operating point.
- **Coronary** pane — LAD/LCx/RCA territories with intramyocardial pressure, stenosis, and FFR readouts.
- **Physiology knobs**: contractility, afterload (systemic resistance / arterial stiffness), heart rate, venous tone, valve lesions (AS / MR / AR / TR), fluid loading and hemorrhage, and respiration / PEEP.
- Configurable, draggable panel grid for assembling a custom view.

### Physiology model
- **Active-stress cardiac chambers** (LV, RV, LA, RA), with an alternative time-varying elastance mode.
- **Valves** with finite opening/closing dynamics and lesion support (stenosis / regurgitation).
- **Systemic and pulmonary** arterial/venous trees (windkessel-style compliances, resistances, inertances).
- **Pericardial pressure + septal (ventricular-interaction) coupling.**
- **Coronary circulation** (3-territory bed with intramyocardial compression and stenosis/FFR).
- **Mass-conservative** closed loop, with a total-blood-volume ledger for fluid/hemorrhage.

### Lessons (teaching layer)
- **Learn mode**: step through authored lessons with rich text, math (KaTeX), and embedded simulation panes.
- **Authoring**: create lessons, expose a small set of knobs for learners to manipulate live, and save them.
- **Sharing**: lessons persist locally (work offline) and can optionally be shared via **Firebase** cloud sync.

### Official cases
- Curated, in-repo scenarios authored on a normal baseline via physiology knobs / named interventions, e.g.:
  - Normal physiology
  - Cardiogenic shock: LV failure ± dobutamine
  - Valvular lesions: aortic stenosis & mitral regurgitation
  - Hypovolemia
- Each case carries its own model-limitations note and serves as a subject for the waveform-shape regression gates.

---

## Tech stack

- **React 19** + **TypeScript**, bundled with **Vite 6**
- **Tailwind CSS** (via `@tailwindcss/vite`)
- **D3** and **Recharts** for charts and PV loops
- **BlockNote** for rich-text lesson authoring
- **KaTeX** / `react-katex` for math
- **react-grid-layout** for the configurable panel dashboard
- **Firebase** (Google auth + Firestore) for cloud lesson sharing
- **Vitest** for the engine and UI test suites

---

## Getting started

### Prerequisites
- **Node.js** (a current LTS release is recommended)

### Install & run
```bash
npm install
npm run dev
```

This starts the Vite dev server (default `http://localhost:3000`). The simulator, the Workbench, the official cases, and **local** lessons all work offline with no additional configuration.

### Firebase (optional — only for cloud features)
Google sign-in and **cloud lesson sharing** are backed by Firebase. They are optional: everything else works without an account. Firebase project configuration lives in the repo (`firebaseSetup.ts`, `firebase.json`, `firestore.rules`); to enable cloud features against your own project, point those at your Firebase project and deploy the Firestore rules.

---

## Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start the dev server with HMR |
| `build` | `tsc && vite build` | Type-check, then produce a production build |
| `preview` | `vite preview` | Serve the production build locally |
| `test` | `vitest run` | Run the full test suite once |
| `test:watch` | `vitest` | Run tests in watch mode |

---

## Testing

```bash
npm run test
```

The suite (Vitest) covers both the **simulation engine** and the **UI**, including physiology **waveform-morphology gates** that guard against regressions in the shape of key signals (PV loops, mitral inflow E/A, atrial loops, etc.) and baseline snapshot freezes that catch unintended behavioral changes. Keep the suite green when contributing.

---

## Project structure

```
engine/         0D model core (ModelCore.ts), explicit RK solver, knob/parameter
                contract (protocol.ts), headless scenario harness (harness.ts),
                mechanics (pericardium/septum), observables + engine tests
components/     React UI — Workbench, Charts (waveforms / PV loop / Guyton-Starling / coronary),
                Controls (physiology knobs), Home, lessons (LessonPlayer / LessonAuthoring),
                ModelLimitations, official cases UI
components/workbench/   panel grid + editor, headers, side panels (the dashboard shell)
docs/research/  physiology parameter-validity navigator (literature-grounded validity docs)
officialCases.ts        curated teaching scenarios
contexts/, lessonCloud.ts, firestore.rules, firebase.json   Firebase auth + cloud lesson sharing
__tests__/, *.test.ts   Vitest suites
```

---

## Calibration stance & physiology

HemoSim 0D models the circulation as a closed loop of lumped compartments: active-stress cardiac chambers, dynamic valves, and systemic/pulmonary trees, with pericardial/septal coupling and a coronary bed layered on top. The design philosophy is **shape-first** — waveform morphology and the *direction* of change under a perturbation are prioritized over matching absolute numbers, because the abnormal and pathological scenarios are the point of the tool. Treat parameters as **calibration targets**, not fixed constants; the model is built to reproduce the *qualitative* hemodynamic response, and absolute values are approximate.

The **physiology validity navigator** — [`docs/research/README.md`](docs/research/README.md) — is the evidence base. It traces each parameter group (chamber geometry/EDPVR, valves, pericardium/septum, Guyton/Starling, coronary circulation, waveform morphology, atrial AV-plane reservoir, …) to its canonical literature source and records the model value, computation, and an honest verdict / open-question list.

---

## Contributing

- **Documentation ground rules** (see `docs/research/README.md`): cite **real references only** — never fabricate a citation, DOI, or page number; numbers must be **code-verified or two-party cross-checked**; document gaps and open questions honestly; always state units.
- **Tests must stay green.** Run `npm run test` before submitting changes; physiology-morphology gates are part of the suite.

---

## License

No `LICENSE` file is currently present in this repository — licensing is **to be determined**. Please check the repository (or open an issue) before reusing the code.
