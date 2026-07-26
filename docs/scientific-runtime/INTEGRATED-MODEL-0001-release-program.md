# INTEGRATED-MODEL-0001: base + coronary + MCS + rhythm release program

Status: implementation and evidence program. No integrated release is claimed by this document.

## 1. Decision

The next long-lived scientific release will target one explicit assembly:

`base five-wall closed loop + coronary V3 + stateful MCS + event-driven rhythm`

The release will not silently relabel the existing
`circleheart/adult-five-wall-noncoronary@0.2.0` artifact. It will receive a new
simulation release identity, accepted-state schema, observable schema,
protocol catalog, evidence set, and executable Worker artifact.

Autonomic reflexes and multipatch/regional conduction remain outside this
release. They may be added only as later, separately identified releases. This
is deliberate: the integrated release should first establish a stable causal
model for chamber mechanics, coronary perfusion, support devices, and rhythm
without adding poorly identifiable controller or spatial states.

The context of use is research and education. The release will not claim
patient-specific prediction, diagnosis, treatment selection, invasive FFR
equivalence, device certification, or spatial electrophysiology.

## 2. Complexity budget

The model should add a state only when an observable or replay property cannot
be represented credibly without it.

| Subsystem | Retained representation | Accepted-state requirement | Explicitly excluded from this release |
|---|---|---|---|
| Base heart and circulation | Existing five-wall Land/SLS, membrane TriSeg, common pericardium, four valves, 15-node circulation | Existing material, valve, flow, and volume state | Multipatch, remodeling, baroreflex, patient fitting |
| Coronary | LAD/LCx/RCA × EPI/ENDO, two intramyocardial storage compartments per layer, signed passive edges, focal lesion loss, six layer-tone states | 16 coronary volumes, six tone states, accepted-cycle autoregulation aggregates, MVC/SIP reference memory | 1D tree, CFD, collaterals, oxygen transport, molecular mediators |
| Rotary MCS | Pressure-dependent LVAD, Impella, VA-ECMO, and VV-ECMO circuits | One flow state per active hydraulic circuit when phasic/rhythm claims are enabled | Motor current, rotor control electronics, thrombosis, hemolysis, thermal state |
| IABP | Aortic displacement with actual valve/rhythm event timing | Inflation/deflation state, trigger memory, assist-ratio counter | ECG morphology and commercial controller AUTO algorithms |
| ECMO gas exchange | Explicitly separate time-mean oxygen-content/Fick model | Only if dynamic gas is later claimed; otherwise a protocol result, not the hemodynamic checkpoint | Dynamic PaO2/PaCO2, acid-base, tissue stores, spatial watershed |
| Rhythm | Atrial and ventricular event streams driving exact-event prescribed calcium | Event scheduler identity and cursor, calcium history, recent activation intervals, deterministic generator state | Ionic action potentials, ECG synthesis, re-entry geometry, regional activation maps |

This boundary is more expressive than a fixed periodic waveform while avoiding
a cellular EP model that the current 0D product cannot identify or validate.

## 3. Current evidence snapshot

### 3.1 Coronary

The reduced topology and numerical ownership are suitable to continue. The
same candidate owns aortic uptake, coronary venous return, mechanics-derived
intramyocardial pressure, 31-volume fixed-TBV accounting, and atomic rollback.
The earlier 2 ms and 1 ms fixed-tone cold-start runs each reached three
consecutive period-one closures at beat 27 without a failed step. Coronary V3
now also owns accepted physical-time autoregulation windows, six tone updates,
mid-window checkpoint state, and rollback inside the coupled transaction.

Those results establish within-dt numerical periodicity and transaction
correctness, not physiological release readiness. The current claim remains
`simulationReady=false` because:

- the normal mean flow is a construction target and is not independent
  validation evidence;
- terminal 2 ms and 1 ms waveforms have not been compared under one explicit
  measurement-site contract;
- pressure-step, hyperemia/recovery, CFR, FFR-like, stenosis/CMD direction,
  and MCS/rhythm interaction protocols are not release-bound; and
- the current browser runtime has no coronary observables or controls.

A separate reduced-network pressure-step characterization now exercises both
80-to-100 and 100-to-80 mmHg interventions with tone active and tone frozen at
2 ms and 1 ms. All eight runs remained finite and conserved. Crossing brackets
and final normalized pressure-flow responses agreed across time step in all
four arms. Three arms also passed the preregistered early-transient comparison.
The 100-to-80 mmHg frozen-tone arm failed because the V1 metric required an
excursion opposite to the sign of an almost-zero final response; both grids
instead produced the same-direction passive storage transient. The V1 result
therefore remains a failed numerical-QA artifact. It is not relabelled as a
model or physiology pass. A V2 protocol replaces only that direction-dependent
metric with the maximum absolute first-five-window transient for every arm,
keeps the 5% cross-dt tolerance, and fixes 1 ms/0.5 ms before the new fine run.
That V2 run is complete. All four arms passed finite-state, conservation,
crossing-bracket, final-response, and direction-independent early-transient
cross-dt gates. The largest early-transient relative difference was below
`7.2e-5`, and both grids gave identical one-second threshold brackets in every
arm. This closes the reduced harness's predeclared numerical-reproducibility
question only; `biologicalValidationEstablished` and
`physiologicalAcceptanceEstablished` remain `false`.
The strict raw-window SVG shows the four dt traces nearly superposed without
window-boundary discontinuity or oscillation. Pressure elevation produces an
immediate passive fall in pressure-gradient/flow followed by a slow rise only
with active tone; pressure reduction gives the opposite passive transient and
slow active decline. Frozen tone returns near baseline after the brief storage
transient. This is a mechanism-sign inspection, not a graph-shape acceptance
criterion.
Neither protocol reproduces the Dankelman left-main cannula, distal zero-flow
wedge, constant-flow boundary, or manual regression estimator, so neither is
eligible for direct comparison with the published t50 values.

The first lesion/structural-CMD V1 characterization deliberately froze tone.
Under that condition, extra structural resistance depressed rest flow more
than hyperemic flow and the reserve ratio rose; that failed direction remains
stored unchanged. A separately declared V2 companion now evolves active rest,
hands the exact terminal state into active hyperemia, and changes only LAD
layer R1+Rm at none/moderate/severe levels. On the 1 ms grid, LAD inlet-flow
reserve fell `1.77693 -> 1.47954 -> 1.27452`; the 2 ms values differed by at
most `5.7241e-8` relatively, and every run was finite and conservative. Thus
the intended structural-resistance direction is present when rest
autoregulation is represented. The aggregate artifact still fails: all arms
reached the predeclared 250-window rest cap above the `1e-5` tone-change gate,
and severe rest demand error was `1.0288%` against the fixed `1%` gate. No
threshold was relaxed. This is mechanism-direction evidence in a reduced
network, not clinical CFR, FFR, MRR or structural-CMD validation.

The topology is therefore **conditionally adopted**, while its current normal
parameterization is not promoted as a healthy canonical release.

### 3.2 MCS

The device graph now has both an algebraic shadow and a stateful dynamic
candidate. It evaluates
pressure-dependent support in the same backward-Euler candidate, retains
reverse flow, conserves pump transfers, distinguishes VA and VV cannulation,
and supplies explicit research-only gas and safety readbacks. The existing
matrix provides component checks and assembly-level directional checks.

It does not yet provide independent quantitative validation. The quasi-static
rotary reduction remains too weak for the combined rhythm claim. The
published HeartMate-II coefficients, including both cannulae, imply

\[
R_{eq}=0.3061\ \mathrm{mmHg\,s/mL},\qquad
L_{eq}=0.04717\ \mathrm{mmHg\,s^2/mL},\qquad
L_{eq}/R_{eq}\approx0.154\ \mathrm{s}.
\]

That scale is material at tachycardic cycle lengths and for phasic coronary
flow. The implementation now integrates one accepted flow state per rotary
circuit with backward Euler, analytic pressure/volume/previous-flow
derivatives, reverse flow, profile-explicit caps, and clamp reactions. The
HeartMate-II profile has no instantaneous forward cap: it transcribes the
published Choi low-LV-pressure series resistance and reports the published
9 L/min experimental traversal and advertised 10 L/min capacity only as
non-clipping evidence-domain diagnostics. The cited HeartMate-II pump plus
two-cannula inertances and suction equation are construction/transcription
evidence only. Other devices still require their own profiles and held-out
quantitative checks. Pump start, chamber-collapse geometry, chatter, and
speed-controller dynamics remain outside the context of use unless separately
validated.

### 3.3 Rhythm

The released main-wire calcium source is still a fixed-period function of
absolute time, but this integration branch now contains a narrow accepted-time
generated foundation:

- two exactly propagated rise/decay states per wall;
- additive, wall-selective events owned by an external schedule;
- deterministic off-grid event splitting;
- atomic circulation/mechanics/calcium commit and rollback; and
- schedule/content identity and checkpoint semantics.

That work correctly makes no calcium-cycling, restitution, force-interval, ECG,
or clinical arrhythmia claim. The static full-content-bound replay remains a
V1 shadow backend. Transaction V2 now owns a signed finite-history regular
sinus/flutter generator, AV recovery/concealment, a causal pending effective-
calcium queue, and the five calcium histories. Separate accepted owners now
also exist for authored PAC/PVC, distal pass/refractory/mask/disconnect,
escape/VVI, interval-dependent ventricular calcium strength, and a stationary
seeded AF atrial source. These owners and their standalone atomic composition
are implementation substrate; they are not yet a live coupled-release or
held-out phenotype-validation claim.

The audit found two especially reusable, self-contained concepts: the exact
two-state calcium kernel and the accepted physical-time interval owner with
`(t_n,t_{n+1}]` event semantics. The later experimental branches add useful
five-wall trial/commit, off-grid splitting, full schedule snapshots, and exact
restore patterns, but are 138 commits removed from the two inspected branch
tips and retain an old noncoronary transaction. They must not be merged or
cherry-picked wholesale. Static explicit schedules remain valuable as replay
and test backends; the released runtime instead derives calcium stimuli from
accepted rhythm state and a pending event queue.

The minimal expressive event model has three typed layers:

1. source impulses such as sinus, atrial tachy/flutter, fibrillatory atrial
   impulses, PAC, PVC, escape, and pacing;
2. captured atrial or ventricular activations with parentage and block/capture
   result; and
3. derived actuators such as wall calcium stimulus and IABP transition.

The second layer has a standalone V2 accepted owner. It enforces complete
same-time arbitration, independent atrial/ventricular refractory gates,
source-route restrictions, parent lineage, exact recomputation, rollback, and
full-state SHA checkpoint/restore. A standalone composed transaction now
resolves regular/external-AF/authored source impulses, capture, proximal AV
recovery/concealment, distal conduction, conditional VVI, accepted ventricular
feedback, interval strength, and future exact-calcium deposits under one
commit. It now also owns the optional finite authored ventricular-pacing replay
cursor, clips at its next exact boundary, sends its typed pacing impulse through
the same capture/refractory arbitration, and binds the complete schedule in its
checkpoint. The external AF source state remains outside the composed owner,
but a separate outer transaction/checkpoint now commits the seeded AF owner and
Main V3 together under one clock/revision and rolls both back on any failure.
Accepting these component and transaction contracts is not the same as
validating a sinus, AF, ectopy, block, escape, or pacing phenotype.

This separates an authored rhythm mechanism from the hemodynamic activation it
produces. In particular, AF produces no coordinated atrial calcium event; its
atrial impulses are inputs to an AV gate. A small recovery-dependent AV-node
model is preferred over case-specific conduction scripts because it can
represent normal conduction, rate-dependent delay, concealed conduction, AF,
and flutter filtering with one owner. Infra-His deterministic drop/disconnect
patterns remain a separate phenotype layer for Mobitz II, high-grade, and
complete block and do not claim tissue electrophysiology.

The exact two-state calcium kernel is sufficient for sinus compatibility and
event timing. A separate one-state interval-strength owner now supplies a
mechanistic construction candidate for short-interval depression and
post-extrasystolic potentiation. Its Rice-derived shape and inspected Gwathmey
context are not independent human validation, and it remains outside a live
hemodynamic claim until coupled evidence is run.

## 4. One accepted transaction

The release must have one promotion boundary. A successful step promotes the
following tuple exactly once:

1. noncoronary circulation state;
2. coronary hydraulic state;
3. coronary accepted-cycle autoregulation aggregate and tone state;
4. five-wall mechanics state;
5. event-driven calcium and rhythm state;
6. stateful rotary-circuit flow and IABP trigger state when enabled; and
7. MVC/SIP and valve-event memories.

Any failed mechanics, circulation, coronary, rhythm, device, or input trial
returns the bit-exact previous accepted tuple. Candidate evaluations must all
start from the same previous accepted state; Newton, line-search, finite-
difference, and shadow probes must not retain hidden warm starts.

`MainWireIntegratedModelTransactionV2` now owns the single promotion boundary
for coronary V3, generated source/AV/pending-event/five-wall calcium, and four
dynamic MCS flow states. It establishes:

- preservation of the causal t0 pending ventricular-calcium event;
- all-device-off accepted-state and native-flow bit identity;
- same-candidate LVAD and coronary coupling with device and global blood-
  volume conservation;
- coronary-first/event-first/exact-tie boundary ownership;
- analytic/semismooth Jacobian operation with a finite-difference shadow; and
- whole-tuple rollback on malformed MCS input.

The V2 integrated checkpoint applies an outer canonical SHA-256, verifies the
nested coronary, generated-owner, and nested-generator checkpoints, and
separately hashes the complete generated binding, dynamic inertance profile,
and structural hydraulic projection. It resumes exactly from 0.006 s while a
ventricular calcium event at 0.012 s is pending, the coronary window is partial,
and LVAD q is nonzero. The static V1 checkpoint remains frozen as the replay
shadow, including its real FNV32-collision regression.

Transaction V3 now replaces the generated-owner lane with the standalone
composed rhythm transaction at that same promotion boundary. The composition
directly owns AV recovery/concealment V2, capture, distal conduction, escape/
conditional VVI, interval strength, pending exact-calcium deposits and five
calcium histories. It is the sole live calcium owner: fixed-period V1,
generated-owner V2, caller calcium override and legacy owner-shaped inputs are
rejected before stepping. Its V3 checkpoint binds the complete composition,
coronary V3 and dynamic MCS state. A canonical five-wall provider with regular
sinus and active HeartMate II completed a bounded cold-start second with exact
clock alignment and conservation; a checkpoint at 0.8 s while a distal impulse
was pending resumed to the exact uninterrupted state. This is transaction and
replay evidence, not physiological validation. The external-AF wrapper has
also passed exact off-grid boundary, retry/rollback, nested-tamper, and pending-
ventricular-calcium checkpoint-resume tests. Canonical-provider external-AF
hemodynamic characterization, extraction of an accepted modeled aortic-valve
forward-flow-cessation event into the standalone IABP actuator, and
long-duration V3 evidence remain release blockers. That event is not to be
relabelled as independently validated anatomical leaflet closure: the current
quasi-steady valve has no bulk-flow inertia or leaflet contact, and experimental
pressure crossover can precede flow-defined end-ejection
([Bermejo et al. 2004](https://doi.org/10.1161/01.CIR.0000139846.66047.62)).

The standalone IABP actuator now owns a ventricular-capture counter, current
beat lineage, an accepted same-beat valve-event input, and a finite-duration cubic-smoothstep
balloon transition. Captured ventricular activation starts deflation; only the
same beat's later accepted valve event can start inflation. Explicit 1:1/1:2/1:3
counting, irregular intervals, same-time cessation-before-next-capture ordering,
missed/wrong/duplicate event rejection, retry/rollback, and an exact
mid-transition checkpoint are verified. Its displacement law is the existing
`40 mL * activation01` SA excluded-volume reduction. It is deliberately not
yet connected to the circulation: the remaining seam is an accepted,
lineage-bound modeled forward-flow-cessation time with an explicit applicability and
non-claim boundary, not another phase approximation.

The first generic-profile waveform audit exposed that provisional whole-LV-
volume/pressure availability and a 10 L/min hard cap were materially shaping
the result; those outputs are retained only as a superseded diagnostic and are
not evidence for HeartMate-II physiology. The corrected profile uses the Choi
pressure-dependent series resistance in the hydraulic residual and no forward
cap. In a continuous five-cycle 2 ms rerun, every constraint-owner fraction is
zero and every flow remains finite and conserved. Mean LVAD flow moves from
82.13 to 58.00 mL/s, mean aortic pressure from 70.57 to 85.52 mmHg, and mean LV
volume from 70.19 to 77.16 mL. The cycle-4-to-5 H-Q area changes 8.40%, the
maximum noncoronary boundary difference remains 15.25 mL, and LVAD-q closure
remains -5.63 mL/s at cycle 5. Maximum instantaneous flow is 12.19 L/min in
cycle 1 and 11.31 L/min in cycle 5; these are reported above the advertised
domain without clipping or a fictitious reaction. Thus the corrected run is
still nonperiodic at five cycles. No stabilization tolerance was fitted to
these outputs.

The first corrected canonical full-state run then reached its inherited
32-cycle cap without a failed step, but did not establish P1. At cycle 32 its
maximum P1 delta was `0.003804847`, on
`coronary.toneResistanceScaleByTerritoryLayer.LCx.subendocardial`; P2 was
`0.007647827`, exactly the sum of the two latest monotone P1 tone increments,
not evidence of an alternating orbit. The accepted window was exactly empty
at 32 s. Cycle-31-to-32 mean LVAD flow, aortic pressure, and LV volume changed
by only `-0.00374 mL/s`, `+0.00193 mmHg`, and `+0.00185 mL`, respectively.
Inverting the accepted update equation gives `Qm/Q*=1.09162` for the limiting
layer, so the residual is the expected direction of an unfinished slow tone
adaptation rather than an absolute-time or window-accounting defect.

The 32-cycle cap came from the earlier fixed-tone periodic policy and is not a
valid horizon once the explicit 25 s live coronary controller coefficient is
part of the accepted state. Before running a replacement canonical job, the
maximum was therefore fixed at `10 * 25 s = 250 s`, or 250 cycles for this
fixed 1 s sinus fixture. This number is derived only from the declared slow
state prior and cycle length, not from extrapolating the 32-cycle output. The
P1/P2 tolerances and three-consecutive-cycle rule remain bit-for-bit unchanged;
there is no shooting, acceleration, waveform fitting, or threshold adjustment.
Each cycle now retains the one accepted window's complete six-layer
`Qm/Q*`, previous/next tone, delta-log-tone, control signal, bound status,
window index, and duration, and fails closed if that completion is absent.
The predeclared 250-cycle fixed-horizon characterization has now completed at
2 ms without a failed step or conservation violation. The maximum normalized
P1 change fell from `1.45644` at cycle 1 to `0.00380485` at cycle 32,
`0.000969450` at cycle 137, and `0.000160254` at cycle 250. The terminal slow
state remained LAD subendocardial tone, but all six terminal accepted-window
flow-to-demand ratios were within 0.30% of one. Mean LVAD flow, aortic pressure,
LV pressure, and LV volume at cycle 250 were `44.6319 mL/s`, `93.8452 mmHg`,
`27.2968 mmHg`, and `89.2374 mL`, respectively. Because the execution purpose
was fixed-horizon characterization, its observations were deliberately marked
bounded exploration and the classifier remained `not-converged`; the result
does not establish canonical P1, physiology, or release acceptance.

The exact cycle-250 checkpoint was also used as a common initial state for a
separate one-cycle 2 ms/1 ms local refinement. Event identity and timing were
identical, every predeclared descriptor passed, and the largest normalized
difference was `0.00527541` (the LVAD pressure-rise range). This establishes
local time-step consistency from that exact long-run state. It does not turn
the fixed-horizon trajectory into a periodic orbit, provide an independently
converged cold 1 ms orbit, or establish physiological acceptance.

The raw terminal-cycle graph is smooth at the chamber scale and its LV
pressure-volume loop is counter-clockwise without self-intersection. It also
exposes an unmatched-regime warning rather than hiding it: at the verification-only
HeartMate-II operating condition, signed pump flow ranged from `-17.67` to
`190.19 mL/s`, with 48.4% reverse-flow residence and 11.0% residence above
10 L/min. Its x=flow/y=delivered-head loop was counter-clockwise. A later
independent HeartMate-II mock-loop study at 8 and 11 krpm found the same
counter-clockwise direction for LV ejection fractions of 10--28%
([May-Newman 2022](https://doi.org/10.1111/aor.14157)); the earlier clockwise
interpretation inferred from systolic/diastolic extrema was incorrect because
it ignored dynamic phase lag. Direction is therefore compatible, but the
present 60 bpm healthy-heart boundary, pressure stations, mean flow, reverse
residence and high-flow residence do not match a frozen independent protocol.
The waveform remains unaccepted for lack of matched evidence, not because its
loop direction is known to be wrong. The equations remain finite and
conservative, and no cap is introduced to improve the appearance.
A second independent result provides useful bracketing context rather than a
pass: Sunagawa's normal-heart HeartMate-II mock loop had a peak reverse flow
near `-3 L/min` at 8000 rpm and almost none at 10000 rpm. The present 9000 rpm
minimum is about `-1.06 L/min`, which is compatible with that speed ordering,
but the study does not report a matched reverse-residence gate and its loop
conditions differ ([Sunagawa et al. 2015](https://doi.org/10.1016/j.jtcvs.2015.04.015)).
A separate fit-free mean-point projection makes the measurement-site problem
explicit. At Stanfield Table 3's 55/70/53 mmHg mean differentials, the unchanged
internal-pump law predicts `8.86/3.59/9.56 L/min`; adding the currently configured
drainage and return resistances predicts `4.94/2.00/5.33 L/min`, versus reported
`4.8/3.4/5.0 L/min`. The cannula-inclusive values lie inside all three reported
mean +/- SD bands, while the internal-pump values do so only at 70 mmHg. Because
the exact source-transducer-to-model-segment mapping is unavailable, neither
projection is promoted: choosing the visually favorable station after seeing
the result would be post-hoc. The reported SD is also not treated as an
acceptance tolerance.

A separate cold, all-device-off composed-rhythm V3 canonical run at nominal
2 ms has now established numerical P1 at cycle 70 under the unchanged
three-consecutive-cycle policy. Evidence cycles 68--70 passed; the final P1
and P2 maxima were `0.000958567` and `0.001931967`. All accepted cycles were
finite, conservative and event-exact, the terminal checkpoint resumed exactly,
and all four MCS flows and transfers remained zero. Its raw accepted-endpoint
graph is smooth without numerical ringing: the LV pressure-volume loop is
counter-clockwise, all native valve flows are nonnegative for the competent
fixture, coronary flow is diastolic-predominant, and the atrial/ventricular
calcium events retain exact timing. This establishes a canonical numerical
orbit, not physiological acceptance. The unchanged healthy screen passes EF,
cardiac index and mean LA pressure but fails EDVi, ESVi and PASP; the base
release fails the same three categories, so they remain inherited review work
rather than being normalized into a pass.

The first diagnostic after that result is not a parameter fit. Base owns
`5522.11 mL` in its noncoronary ledger, whereas the V3 terminal tuple contains
`5587.307 mL` noncoronary plus `12.693 mL` coronary blood under the fixed
`5600 mL` global ledger. A predeclared two-arm cold V3 comparison will therefore
hold topology, autoregulation, rhythm, MCS, material and resistance fixed and
change only the global ledger: `5600 mL` versus `5539.666 mL` (base
noncoronary plus the explicit `17.556 mL` cold coronary volume), using the same
SV/VC shared-pressure distribution. It will report paired EDV/ESV, atrial and
pulmonary pressures, pulmonary pulse/compliance/PVR surrogates, output,
coronary volume/flow/tone, P1 and numerics without a health threshold or fit
objective. Only after that attribution experiment may a separately declared
pulmonary-compliance bracket be considered.

A cold canonical 1 ms orbit, matched active-MCS V3 protocols, and independent
pulsatile MCS/coronary waveform checks remain required. The completed
checkpoint-started local refinement is numerical evidence only and does not
substitute for those gates.

This is numerical integration evidence only. It is not coronary physiology or
device validation evidence.

## 5. Release and UI versioning

Saving only a `SimulationReleaseRef` is necessary but not sufficient for an
old case to remain usable. Each released version must retain an immutable,
content-addressed product bundle containing:

- the exact simulation release manifest;
- the executable Worker artifact and numerical ABI identity;
- accepted-state/checkpoint codec;
- control catalog and composition rules;
- observable and derived-metric catalogs;
- approved protocol catalog;
- graph/view templates and availability rules; and
- official preset/case catalog references.

A saved case resolves this exact bundle. The current application bundle must
never reinterpret it with the latest controllers or graphs. A workspace
continues to store presentation layout and semantic view IDs, not equations or
simulation parameters. Availability is resolved by the selected release
bundle: unsupported controls and signals are absent or explicitly reported as
`not-modeled`, never silently mapped to a newer parameter.

Editing an old case under a new model is an explicit fork/upgrade operation
that produces a new case revision, new release reference, migration report,
and retained lineage. Exact checkpoint restore remains identical-release-only;
a declared physical warm start is a different operation.

## 6. Evidence semantics inherited from PR #490

The Evidence Contract V2 distinction is mandatory for every gate:

- **numerical verification**: equations are solved and conserved as declared;
- **construction conformance**: an authored perturbation moves a preregistered
  output in its intended direction;
- **calibration evidence**: data or targets used to select parameters;
- **independent validation**: held-out observations not used for construction;
- **reference context**: literature ranges that delimit interpretation but do
  not by themselves validate this implementation.

A normal-flow target used to construct coronary resistance cannot be reused as
independent normal-flow validation. A device manufacturer curve copied into a
profile verifies transcription only; it does not validate the assembled
patient response. An AF event law cannot be validated by the cohort from which
its RR distribution or interval-strength relation was fitted.

The current V2 runtime comparator supports absolute ranges and paired parent
directions. Integrated release gates also require conservation tolerances,
cross-dt relative differences, ordered sweeps, ratios, waveform features, and
availability. These must be represented as strictly typed comparators or as
predeclared scalar metrics before records are emitted; labels alone must not
carry assessment meaning.

Credibility is scoped to the decision and consequence of error, following the
[FDA 2023 computational-model credibility guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/assessing-credibility-computational-modeling-and-simulation-medical-device-submissions)
and the risk-informed [ASME V&V 40 framework](https://www.asme.org/codes-standards/find-codes-standards/assessing-credibility-of-computational-modeling-through-verification-and-validation-application-to-medical-devices).

## 7. Sequenced implementation and release gates

### Gate A — atomic substrate

- MCS input reaches the coronary same-candidate solve.
- All-off parity, conservation, analytic Jacobian shadow, and rollback pass.
- Combined configuration identities are explicit and immutable.

Status: implemented and covered by multi-step, analytic-Jacobian shadow,
whole-tuple rollback, complete-profile/schedule identity, exact checkpoint,
and canonical-provider active-LVAD smoke tests. Release-profile evidence and
the combined physiological matrix remain open.

### Gate B — coronary accepted physiology

1. Add accepted-cycle Q integrals, perfusion-pressure integrals, window phase,
   sample count, and six-layer tone update to a new checkpoint schema.
2. Re-establish normal beating-reference construction with tone=1 without
   fitting phasic waveforms.
3. Compare 2/1 ms terminal P1 waveforms at source inlet, Art-out, Q1, Q2, and
   coronary venous surfaces; hidden Qm peak timing is diagnostic, not a hard
   clinical gate.
4. Run fixed-IMP pressure steps and sensitivity to C1/C2, compliance split,
   IMP mechanism, and bounded collapse.
5. Run rest → stable hyperemia → recovery and lesion × CMD factorials.
6. Keep FFR-like unavailable at rest, exactly one for zero lesion under its
   hyperemic protocol, and never map 0.80 directly to a treatment decision.

Primary anchors include [Spaan et al. 2000](https://doi.org/10.1152/ajpheart.2000.278.2.H383),
[Algranati et al. 2010](https://doi.org/10.1152/ajpheart.00925.2009),
[Hiramatsu et al. 1998](https://doi.org/10.1111/j.1469-7793.1998.619bn.x),
[Young and Tsai 1973 Part I](https://doi.org/10.1016/0021-9290(73)90099-7),
and [Pijls et al. 1995](https://doi.org/10.1161/01.CIR.92.11.3183).

Status: item 1 is implemented as an accepted physical-time V3 window and new
checkpoint schema, including layer-specific CMD-floor anti-windup, atomic
rollback, exact mid-window resume, and explicit V2 new-run promotion. See
[`accepted-autoregulation-v3.md`](../coronary/accepted-autoregulation-v3.md).
Items 2--6 remain release blockers.

### Gate C — stateful and independently checked MCS

1. Compare algebraic and one-flow-state circuits across mean, waveform,
   tachycardia, speed-step, and suction conditions.
2. Compare full H-Q sweeps with held-out mock-loop points, not only the curve
   used to construct each profile.
3. Make IABP inflation follow accepted modeled aortic-valve forward-flow
   cessation and deflation follow the next ventricular event; test
   early/late/missed triggers.
4. Add central/peripheral VA, ECPella, VA+IABP, and Impella+IABP matrices.
5. Keep VV gas exchange as a time-mean protocol unless dynamic gas states gain
   separate evidence. Do not claim myocardial oxygen delivery while coronary
   oxygen transport is absent.

Primary anchors include [Wang et al. 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC3894974/),
the [FDA Impella CP IFU](https://www.fda.gov/media/140767/download),
[Takahashi et al. 2026](https://doi.org/10.1186/s40635-026-00870-z),
the [ELSO circuit guideline](https://www.elso.org/Portals/0/files/pdf/ELSO_Guidelines_for_Adult_and_Pediatric_Membrane_Oxygenation_Circuits.pdf),
and [Schampaert et al. 2013](https://pubmed.ncbi.nlm.nih.gov/23263334/).
Independent device/assembly candidates are the HeartMate-II mock-loop datasets
of [Sunagawa et al. 2015](https://doi.org/10.1016/j.jtcvs.2015.04.015) and
[Stanfield et al. 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3705790/),
the HeartMate-II dynamic H-Q direction study of
[May-Newman 2022](https://doi.org/10.1111/aor.14157),
the combined Impella/Senko matrix of
[Yahagi et al. 2024](https://doi.org/10.1038/s41598-024-64721-1), and, after
raw numerical data are obtained, the direct Impella measurements of
[Said et al. 2026](https://doi.org/10.1093/ehjacc/zuag066).

Status: the one-flow-state circuit, analytic derivatives, algebraic (L=0)
shadow, accepted q checkpoint, direct HeartMate-II R-L transcription, and the
standalone accepted-event IABP actuator/checkpoint are
implemented. A real-provider one-cycle active-LVAD integration passes exact
resume and conservation checks. Device-specific release profiles, held-out
mock-loop comparisons, Main-V3 AoV-forward-flow-cessation/IABP integration, and items 1--5
remain blockers.
The held-out datasets and allowable metrics are now preregistered, but no
digitized observation has yet been used and no independent-validation result
is claimed.

### Gate D — event-driven rhythm

1. Port the exact-event calcium kernel and accepted-timebase into the current
   combined accepted tuple, first in shadow mode. Preserve the current 60 bpm
   trajectory within a declared tolerance, then prove exact checkpoint resume,
   retry purity, and chunk-size independence.
2. Use `(t_previous,t_next]` ownership and drain each simultaneous event batch
   before commit. Stable ordering is `time, priority, sourceId, sourceSequence`;
   IDs are issued by the source and never depend on dt, chunk, Newton attempt,
   or case revision.
3. Bind atrial and ventricular events separately. Absence of coherent atrial
   activation must be representable without altering passive atrial mechanics.
4. Add a recovery-dependent AV gate and deterministic sinus/flutter sources
   before stochastic AF. A final AF source must reproduce preregistered atrial-
   activity and RR distribution/autocorrelation properties with a specified
   counter-based generator, not merely Poisson bombardment.
5. Treat PAC/PVC burden and pattern, global ventricular runs, AV block, escape,
   flutter conduction, and pacing as event phenotypes without ECG, re-entry,
   cellular trigger, or regional-conduction claims.
6. Add minimal calcium release/recovery state only before claiming interval-
   strength, restitution, or post-extrasystolic potentiation.
7. Replace fixed-period P1-only assessment with event-class-specific contracts:
   full-supercycle closure for deterministic n:m patterns and fixed-duration,
   multi-seed stationarity/distribution checks for AF.
8. Checkpoint source phase/counter, specified PRNG seed/counter, AV refractory
   and concealment state, escape/ectopy cursors, pending queue, activation IDs
   and times, calcium/recovery states, bounded AA/RR history, IABP trigger state,
   and coronary accepted-time aggregates under one SHA-256 identity.

Primary anchors include the human AV-node model of
[Jørgensen et al. 2002](https://doi.org/10.1006/bulm.2002.0313), the
autocorrelation-preserving AF atrial-activity generator of
[Climent et al. 2011](https://pubmed.ncbi.nlm.nih.gov/21830052/), human
force-interval construction context from
[Gwathmey et al. 1990](https://doi.org/10.1172/JCI114611), the recent
20-patch uncoordinated-atrial-mechanics comparison of
[Plappert et al. 2025/2026](https://doi.org/10.1113/JP289469), and the
irregular-versus-regular AF hemodynamic intervention of
[Clark et al. 1997](https://pubmed.ncbi.nlm.nih.gov/9316536/). The independent
human interval-history direction check is
[Hardman et al. 1994](https://doi.org/10.1007/BF00788281); it gates restitution,
postextrasystolic potentiation and decay, not parameter fitting or absolute
`dP/dtmax`. Rhythm labels
and conduction phenotypes follow the official
[2018 ACC/AHA/HRS bradycardia and conduction-delay guideline](https://www.ahajournals.org/doi/10.1161/CIR.0000000000000628)
without implying that this 0D event model reproduces diagnostic ECG features.

Status: items 1--3 are implemented for both the finite static-replay reference
and a generated regular-sinus/flutter owner. The generated lane owns an
integer-indexed source, recovery/concealment AV state, a canonical pending
effective-calcium queue, signed finite pre-start history, and five exact
calcium states under one clock/revision and SHA checkpoint. Its analytic t0
bridge preserves the fixed prior within 2e-12 uM while explicitly retaining
the ventricular calcium event at 0.012 s that derives from a pre-start atrial
impulse. The Jørgensen-style 4:1 flutter sequence is a component reproduction,
not independent validation. The generated owner is wired into the V2 combined
coronary/MCS transaction and its exact checkpoint. Stochastic AF, phenotype layers,
electrical-actuator/IABP ownership, independent rhythm-hemodynamic evidence,
and the remaining parts of items 4--8 are release blockers.

### Gate E — combined interaction matrix

| Matrix | Minimum factors | Required outputs |
|---|---|---|
| C0 parity | all devices off × every rhythm profile | accepted tuple, native pressure/flow, checkpoint identity |
| C1 coronary × LV support | LVAD/Impella level × healthy/LV failure × lesion/CMD × tone state | TBV, LVEDP/EDV/PVA, AoV opening, coronary total/D-T/ENDO-EPI |
| C2 ECPella | VA flow × Impella level × native recovery | MAP, LV unloading, native output, coronary flow, passivity |
| C3 IABP × rhythm | trigger offset × HR 40–180 × AF/PVC/bigeminy × assist ratio | ventricular-ID counting, no double trigger, systolic inflation, afterload, augmentation, coronary flow |
| C4 tachycardia × coronary | rate × demand policy × mild lesion | diastolic time, reserve, ENDO/EPI, tone-floor exhaustion |
| C5 gas | ECMO flow/CO × recirculation × Hb/shunt/VO2 | Fick closure, oxygen content, territorial availability, time weighting |
| C6 numerics | dt refinement × slow/fast rhythm × support level | convergence, conservation, Jacobian mode, state continuity |
| C7 replay | mid-event, mid-inflation, dynamic pump flow, tone window | exact continuation and fail-closed identity mismatch |
| C8 duration | one hour and accelerated 24-hour stress | TBV drift, state boundedness, alert stability, deterministic replay |

Every interaction expectation is preregistered as direction, range, relation,
or availability before inspecting the target output. Magnitude fitting and
held-out validation use disjoint data references.

For sinus and fixed n:m patterns, closure is evaluated over the ventricular or
full atrial-ventricular supercycle rather than an assumed one-second beat. AF
must not emit a P1 claim: it uses warm-up plus fixed physical-time windows and
multi-seed AA/RR mean, variance, quantile, autocorrelation, conduction-ratio,
and hemodynamic distribution comparators. Regular and irregular schedules at
the same mean ventricular rate are compared to isolate irregularity from rate.

### Gate F — release-bound Worker and product surface

- The Worker resolves the integrated release rather than a hard-coded
  noncoronary loader.
- Checkpoint, command, frame, run artifact, and evidence records carry the
  identical full release reference.
- Controls, metrics, protocols, graph templates, and availability come from
  the resolved product bundle.
- Legacy saved cases continue to load their immutable old bundle.
- Browser performance and long-duration stability pass before the integrated
  release becomes the default for new users.

## 8. Stop rules against unjustified complexity

Do not add a proximal coronary inertance or 1D conduit unless the accepted
operating-point, IMP, collapse, measurement-site, and compliance ablations
still fail a preregistered phasic observable. Do not add myogenic or autonomic
states merely to improve one normal waveform. Do not add an ionic model to
produce RR intervals. Do not add dynamic blood gas to support a steady
oxygenation panel.

When the reduced model fails, the evidence record must identify which
observable falsified which mechanism. Only then is the smallest new state or
coupling introduced and re-tested against the complete matrix.
