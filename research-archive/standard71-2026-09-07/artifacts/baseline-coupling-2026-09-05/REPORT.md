# Baseline coupling study — 2026-09-05

## Decision and scope

Research continues from the unadopted amplitude/compliance study in
`../baseline-reference-2026-09-05/REPORT.md`. The published Standard70 baseline,
model identity, Model Surface, and browser were **not changed**. This study is
not a new physiological normal range, clinical validation, or a parameter
identification claim. No gate was relaxed to pass its candidates. No afterload
stress protocol was added.

The central result is a causal separation: existing **Ao_SA inertance contributes
to the late-ejection shoulder/bimodality in tested low-compliance conditions**, but
its removal scarcely changes CI. Raising pressure and output then exposes a
separate preload-reserve limitation. A smooth trace plus passing resting checks
is insufficient to select a baseline.

## Experimental ownership and reproducibility

- HR 70/min, BSA 1.9 m². All interventions use the current valve laws/areas,
  atrial material, pulmonary arterial law, and source ventricular kinetic
  choices, except the explicitly labelled Ca/Aeff counterfactuals.
- Tref is the **single absolute ventricular amplitude owner** (LVFW/SEP/RVFW);
  the public active multiplier is set to one in these research constructions.
- Systemic C scales Ao/SA/Art PV-law amplitude. It changes both tangent
  compliance and stored blood volume at a given pressure; it is **not a pure
  waveform stiffness adjustment at unchanged volume distribution**. Pulmonary
  compliance is not scaled by this additional research parameter.
- Source Ao_SA L is 0.002 mmHg·s²/mL. L=0 removes that momentum term only; R,
  quadratic loss, pressure stations, valve opening state, and the existing
  algebraic pulmonary root are retained. Accepted root flow remains a readback,
  not a hidden continuation state when L=0.
- Ca time probes dilate both matched-alpha time constants, keeping periodic
  extrema and atrial Ca/HR/delays fixed. They construct their own exact event
  configuration and **cold event-memory initialization**. They are not admitted
  baseline-fit coordinates. Aeff=25 restores that one source primitive from
  the selected 26.5; it does not restore the entire original Land model.
- Each run must satisfy the existing complete-state periodic closure for three
  consecutive cycles. Most runs use 2 ms/hot-path-lean. The decisive bimodality
  pair also uses 1 ms/full-invariant. Material diagnostics run on one additional
  settled cycle only; they are not calculated throughout settlement or silently
  substituted for the metric beat.
- Requested reserve uses the existing settled, fixed-coronary-tone, TBV ±12%
  analysis protocol. Its re-settled center can differ slightly from the canonical
  resting beat. Reserve is evaluated at 2 ms, including where rest uses 1 ms.
- Runs use 2–4 workers (8 for the first factorial). Every run directory contains
  requests, complete results, protocol and source snapshots. `experiment-index.json`
  indexes results and their SHA-256 hashes. Intentional repeated controls count
  as separate evaluations; do not treat them as independent biological data.

## 1. L × systemic compliance × TBV factorial

Eight conditions: Tref 166.32 kPa, systemic R multiplier 1.1;
C scale 1 or 0.8; TBV 4850 or 5050 mL; source L or L=0.
All eight reached period-1 settlement.

Matched C=0.8, TBV=5050 comparison:

| Metric | Source L | L=0 |
|---|---:|---:|
| AoP, mmHg | 107.13/79.47 | 108.14/79.40 |
| CI, L/min/m² | 2.7874 | 2.7862 |
| ET, ms | 250 | 248 |
| AV mean / peak gradient, mmHg | 3.904 / 6.650 | 3.994 / 7.453 |
| Late PV chord deficit, mmHg | 1.072 | 0 |
| Ao post-global-peak rebound, mmHg | 1.204 | 0 |
| LVP significant peak count | 1 | 1 |

The low-TBV C=0.8 pair likewise reduced the chord deficit from 0.571 to 0.
Both C=1 pairs had no measured late chord deficit already. Thus the shoulder
is a **coupling effect**, not an unconditional consequence of merely having L.
CI changed by less than 0.002 L/min/m² in every matched pair.

The chord diagnostic is the largest downward residual from the straight chord
between 50% and 90% ejected volume, on transmural LV pressure. It avoids the
Q→0 closure corner, uses accepted endpoints with linear interpolation, and
has **no clinical threshold**. It distinguishes a shallow shoulder from a
significant temporal second peak; absence of a deficit is not proof of a
physiologically correct whole loop. The rebound measure starts after the first
global maximum; it cannot detect a smaller early peak before the global peak.

## 2. True bimodality reproduced at 1 ms

Tref 174.24 kPa, C=0.64, TBV=5050, systemic R=1.1. Full invariants;
both branches independently settled.

| Metric | Source L | L=0 |
|---|---:|---:|
| AoP, mmHg | 111.72/78.92 | 113.22/78.85 |
| CI, L/min/m² | 2.8545 | 2.8530 |
| ET, ms | 251 | 249 |
| AV mean / peak gradient, mmHg | 4.083 / 6.766 | 4.180 / 7.809 |
| LVP significant peak count | 2 | 1 |
| AoP significant peak count | 2 | 1 |
| Late PV chord deficit, mmHg | 2.424 | 0 |
| Resting blocking checks | LVP second peak | none |

See [accepted-waveform comparison](L-ablation-fine.png). The source-L shape
survives step refinement; it is not removed by taking a smaller step. This does
not prove all numerical error is zero, nor qualify the entire L=0 envelope.
L=0 slightly raises peak aortic flow/gradient and changes timing, which remain
part of its eventual acceptance decision.

### Mathematical interpretation, not a fitted physiological claim

Freeze two compliant nodes and their external source/sink perturbations. Their
local homogeneous exchange mode satisfies

`L q'' + R q' + (1/C_Ao + 1/C_SA) q = 0`.

At an **illustrative common 90 mmHg**, the actual source constitutive parameters
give damping ratio 0.424 for C=1 and 0.339 for C=0.64, with damped periods about
230 and 177 ms. These are of the same order as the ejection duration. Lower C
can therefore strengthen an underdamped intra-beat exchange mode while all
elements remain passive. `local-root-mode.json` records the calculation.
This is not an eigenanalysis of the full nonlinear, closed-loop heart and
arterial tree and does not predict the exact peak timing.

**L=0 is a reduced-order candidate, not the statement that real blood has no
inertia.** Primary Windkessel work supports meaningful inertance in suitable
topologies ([Stergiopulos et al. 1999](https://journals.physiology.org/doi/10.1152/ajpheart.1999.276.1.h81)).
In 2404 healthy middle-aged subjects, model-fit comparisons did not establish
one universally best three-/four-element configuration; some fitted inertances
were physically impossible ([Segers et al. 2008](https://journals.sagepub.com/doi/10.1243/09544119JEIM287),
abstract inspected). Those topologies are not identical to this multi-node
network. Neither paper justifies deleting L solely to obtain a prettier curve.
Our result supports testing a simpler root representation with explicit
limitations, not claiming that physiological central pressure must be unimodal.

## 3. Material readback and the length-limited region

At C=0.8, Tref 166.32 kPa and R=1.1, replayed the L=0 low/high TBV pair and
source-L high-TBV control. Accepted LV pressure is reconstructed from the
virtual-work geometry factor times total wall stress to <1e-8 mmHg.

LVFW Land stretch maxima are 1.1922 at TBV4850 and 1.2061 at TBV5050 for L=0;
source-L high TBV reaches 1.2055. The high case spends about 5.7% of forward
ejection samples at stretch ≥1.2. The current Land length dependence caps
parts of force/Ca sensitivity at 1.2. SEP/RVFW do not cross 1.2 in these runs.

This identifies an operating-region issue worth examining, **not proof that
the length cap causes the global Starling knee**. Geometry, activation,
shortening history and filling all change together. Source Land parameters
come from specific human muscle experiments, not a uniquely identified
whole-organ baseline ([Land et al. 2017](https://pubmed.ncbi.nlm.nih.gov/28392437/)).
Simply removing a source constitutive bound would need separate justification.

## 4. Ca dilation and original Aeff: not selected

Six cold runs at Tref166.32 kPa, C=0.8, TBV4950, R=1.01. All settled.

| Probe | CI | ET ms | E/A | Tei | Rest blockers |
|---|---:|---:|---:|---:|---|
| Source L, selected Ca/Aeff | 2.7394 | 242 | 0.812 | 0.633 | none |
| L=0, selected Ca/Aeff | 2.7385 | 242 | 0.808 | 0.633 | none |
| L=0, Ca time ×1.1 | 2.7462 | 250 | 0.774 | 0.661 | E/A, Tei |
| L=0, Ca time ×1.2 | 2.7457 | 258 | 0.740 | 0.671 | E/A, ICT, Tei |
| L=0, Aeff=25 | 2.7629 | 236 | 0.816 | 0.657 | ET, Tei |
| L=0, Ca×1.1 and Aeff=25 | 2.7682 | 244 | 0.779 | 0.677 | E/A, Tei |

All L=0 runs have one significant LVP/Ao peak, no measured late chord deficit
or post-global-peak rebound. Ca prolongation raises EF but decreases EDV;
SV/CI barely change. It is not a solution by itself.

Repeating the L=0 control and Ca×1.2 with formal preload reserve:

| Metric | Control | Ca×1.2 |
|---|---:|---:|
| Center CO, L/min | 5.203 | 5.217 |
| Low-TBV CO, L/min | 4.248 | 4.191 |
| High-TBV CO, L/min | 5.447 | 5.694 |
| High-TBV CO gain | 4.69% | 9.14% |
| Center PCWP surrogate, mmHg | 9.597 | 9.114 |
| High-TBV PCWP surrogate, mmHg | 18.523 | 17.836 |

The reserve effect is real within the tested model/protocol even though rest
CI barely changes. It must not be hidden by a claim that Ca had "no effect."
Nevertheless the simultaneous filling/timing deterioration prevents adopting
this simple time-dilation candidate.

## 5. Lower arterial storage, then pump × passive amplitude

After L removal, C=0.6 can be evaluated without the previous two-peak obstacle.
At Tref190.08 kPa, R=1.05, TBV4850→5050, CI is 2.760→2.910 and AoP is
106.78/72.60→112.81/76.62. The high case passes resting checks; the low case
misses ET and E/A. The high case was then tested for reserve, not adopted.

Four cold conditions at C=0.6, L=0, TBV5050, R=1.05, selected Ca/Aeff:

| Tref kPa / passive scale | AoP mmHg | CI | ET ms | E/A | High-TBV CO gain |
|---|---:|---:|---:|---:|---:|
| 190.08 / 1.04 | 112.81/76.62 | 2.910 | 248 | 0.820 | −0.185% |
| 190.08 / 0.85 | 114.08/77.38 | 2.944 | 250 | 0.798 | −0.196% |
| 228.096 / 1.04 | 115.58/77.78 | 2.968 | 240 | 0.764 | +1.524% |
| 228.096 / 0.85 | 116.78/78.48 | 3.001 | 242 | 0.748 | +1.465% |

All settle and retain one significant pressure peak with no late chord deficit.
All **fail the existing high-volume reserve response**. The last three fail
resting E/A; the last also fails the pulmonary mean-gradient resting check.
The passive intervention scales both equilibrium passive stress and SLS
modulus, not only end-diastolic compliance and not generic "lusitropy."
Tref228.096 is an intervention endpoint outside the admitted baseline-fit
Tref domain, not a demonstrated normal adult tension.

The pressure improvement therefore does not establish a usable baseline.
At the Tref190.08/passive1.04 center, increasing TBV 5050→5656 raises the
PCWP surrogate 11.33→22.60 mmHg while LVEDV changes only 144.77→144.92 mL
and CO 5.528→5.518 L/min. Lowering passive amplitude to 0.85 hardly resolves
this behavior. Increasing tension by 20% gives only about 2% more resting CI,
shortens ET and raises AV gradients. Continuing an undirected Tref/TBV grid
is not the recommended next step.

## 6. High-volume material follow-up

Two further canonical cold runs, Tref190.08/C0.6/L0 with TBV5050 or 5656,
both settle. The high case reproduces the stalled output (CI2.904 versus
2.910), nearly unchanged LVEDV (144.919 versus 144.758 mL), and increased RVEDV
(168.317 versus 152.136 mL). This observation is beside, not a replacement for,
the fixed-control reserve protocol above.

At the same cycle phase 0.700, both have exactly the same free ventricular Ca
(0.1970606 µM), but the pressure accounting differs markedly:

| LV absolute-pressure contribution, mmHg | TBV5050 | TBV5656 |
|---|---:|---:|
| Active stress × geometry | 4.828 | 13.073 |
| Equilibrium passive stress × geometry | 1.537 | 3.613 |
| SLS stress × geometry | 1.090 | 1.163 |
| External pressure | 0 | 1.262 |
| Total LVP | 7.455 | 19.111 |

At this phase LV volume is 108.71 versus 123.96 mL and Land stretch 1.1253
versus 1.1586. All contributions are reconstructed from the accepted state;
`diastolic-accounting.json` stores the values and asserts their sum. The active
term accounts arithmetically for about 71% of the LVP difference at this phase.
**This is accounting, not a 71% causal attribution**: loading, geometry and
material memory covary. It nevertheless rules out explaining this trajectory's
pressure increase solely by passive stiffness or external pressure. Nor does
the fact that active stress is nonzero alone establish a physiological error.

The next targeted issue is therefore **persistent diastolic activation and
its length sensitivity**, including the reference-stretch→Land coupling and
the Ca tail/resting level. Increasing Tref multiplies residual as well as
systolic active stress; it need not raise useful output proportionally.
The isolated length cap at 1.2 is not sufficient as an explanation: the marked
active-pressure increase above already occurs below that cap.

## Implementation and verification

Research-only exact construction adds optional Ao_SA inertance ablation and
bounded Ca/Aeff counterfactuals, preserving construction identities and event
ownership. Analysis adds descriptive shape and accepted-material readback;
neither is a new public output or clinical gate. Runner records identities,
source snapshots, timing, both rest and reserve failures, and never exports a
published-model checkpoint for a changed research construction.

The older bilateral algebraic-root profile was inspected for reuse, but its
exact compatibility contract requires the selected recovered-aortic-outflow
owner. Importing it would add unrelated pressure/valve changes. The isolated
research ablation is retained instead; `existing-root-compatibility.json`
records the actual rejection, without weakening that contract. No claim of
intervention equivalence is based on replacing only a fixture readback field.

TypeScript typecheck and 112 tests across eight selected files passed. Coverage
includes exact source-cycle parity, distinct parameter/checkpoint ownership,
the actual momentum residual, zero-L continuation-memory independence,
canonical/structural analysis compatibility, source Ca extrema/event ownership,
geometry/stress reconstruction, diagnostic shape cases, existing baseline
gates and typed-authority regressions. This is targeted verification, **not a
claim that the repository's entire test suite ran**. `git diff --check` passed.

## Next decision

1. Keep L=0 as the preferred **candidate to simplify the problematic coupling**,
   with source-L controls and explicit no-wave-propagation limitations. Do not
   add another valve inertia/opening state to compensate for the observed mode.
2. Treat CI, pressure, ejection duration and filling reserve jointly. Retain
   source Ca/Land kinetics for ordinary fitting; the simple Ca and Aeff changes
   here are rejected as complete baseline solutions.
3. Investigate the now-observed residual-active/filling response with a small
   **separate constitutive comparison of length sensitivity and diastolic
   activation**, preserving an explicit systolic material reference. Do not
   simply remove all diastolic active force or relax a source length cap.
   Reference stretch, tissue amplitude and geometry must not become freely
   interchangeable unidentifiable fit knobs.
4. Require a credible candidate's resting timing/shape and low/high preload
   responses, followed by step-size confirmation and useful parameter headroom,
   before baseline adoption/model minting. No new afterload stress test is
   required. No additional maintainer decision is currently needed.
