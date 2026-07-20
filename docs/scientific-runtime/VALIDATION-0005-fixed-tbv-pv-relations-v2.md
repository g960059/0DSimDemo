# VALIDATION-0005: fixed-TBV PV-relations protocol V2 smoke characterization

## Scope and claim boundary

This note records a 2026-07-20 local smoke characterization of
`MainWireScientificPvRelationsProtocolV2` on the bundled official healthy
periodic checkpoint at base commit `7111487`. It is not clinical validation,
patient-specific fitting, an intrinsic myocardial material law, or evidence
that the method generalizes to every preset.

The protocol operates on a restored branch checkpoint. Total blood volume and
all **non-intervention** model parameters and controls remain fixed; the sole
intervention is an adaptive, bounded multiplier on `VC_RA` resistance. The
source scenario is never advanced and requires no recovery beats.

The V2 acquisition contract is:

- phase-align the branch to the end of forward aortic ejection;
- acquire a chronological aortic-opening → forward-ejection-end cycle without
  wrapping a changing-load sample array;
- complete the resistance ramp during early diastole and reject a beat unless
  the declared target scale is present at both ED and ES;
- require two sustained samples (4 ms at the canonical 2 ms step) for a valve
  threshold event;
- allow negative MV/AoV flow as regurgitant flow, while forward flow above the
  threshold remains incompatible with the ED gate;
- stop using the predeclared point-count and EDV-span rule, independent of
  whether any fitted relation passes QC.

The default maximum resistance multiplier is 16, reduced from the legacy value
64 after event-locking changed the achieved unloading envelope. The protocol
is fail-closed for configured MR/AR (including unbracketed positive reverse
EROA) until lesion-specific event and fit validation is available.

## Canonical 2 ms healthy result

The protocol body completed in approximately **3.25 s** on the local
development host. Import, release verification, checkpoint restoration, and UI
transport were outside the timer. Wall-clock values are diagnostic only.

| Quantity | Result |
| --- | ---: |
| termination | predeclared loading span reached |
| valid beats | 7 / 7 |
| fit-selected beats | 6 |
| source session unchanged | yes |
| fixed TBV | 5522.11 mL |
| VC_RA multiplier range | 1–16 |
| LV EDV range | 101.371–153.222 mL |
| LV EDPtm range | 1.819–12.062 mmHg |
| LV ESV range | 47.306–64.342 mL |
| LV ESPtm range | 89.856–99.261 mmHg |
| maximum absolute TBV error | 2.73×10⁻¹² mL |
| maximum continuity residual | 2.30×10⁻⁸ mL |
| linear ESPVR | rejected: nonlinearity sensitivity only |
| Klotz-informed hybrid EDPVR | accepted |
| transient path-work–EDV sensitivity | accepted |

The linear ESPVR adjusted R² was 0.99110 and its leave-one-out slope deviation
was 0.08673; it was rejected because the declared quadratic sensitivity found
meaningful nonlinearity. This is a scientific limitation, not a Worker failure.
Standard UI therefore shows only the observed loading-range endpoint envelope;
Research view may reveal the rejected formal curve and sampled endpoints, but
must not label Ees/V0 as accepted.

The EDPVR adjusted R² was 0.99825 with RMSE 0.11796 mmHg. Its reference volume
uses only the empirical Klotz `V0 = Vm(0.6 - 0.006Pm)` estimate and then fits a
separate multibeat shifted exponential. It is therefore a **Klotz-informed
hybrid multibeat fit**, not the original Klotz single-beat method, which also
constructs a normalized curve using `V30`.

The work signal spans 5159.50–9457.37 mmHg·mL. It is computed as the real-time
transient path integral `-∫P_LV,tm dV` without adding an unobserved last-to-first
chord. Because the path is not a demonstrated closed periodic PV loop, its
linear relation is retained only as **transient path-work–EDV sensitivity**.
The V2 machine-readable result does not expose a `prsw` field and explicitly
sets `conventionalPrswClaimed: false`.

## Source-phase regression

The same exact P1 orbit was tested from the checked-in phase and after advancing
the source branch by 0.300 s. Both runs produced seven valid beats, the same
termination, selected beat IDs, and relation statuses. Maximum differences
were:

- EDV: 0.0103 mL;
- ESPtm: 0.00343 mmHg;
- transient path work: 0.877 mmHg·mL.

This regression protects the event-lock boundary. It specifically prevents the
old failure mode in which a cyclic array wrap combined ED and ES from different
real-time parts of a changing-load window.

## Time-step and event sensitivity boundary

The checked-in official source is a 2 ms accepted orbit. A 1 ms replay from
that 2 ms checkpoint did not reproduce period-1 closure within the canonical
tolerance, so V2 correctly returned `source-periodicity-gate-failed` and
produced no fit. That is a fail-closed sensitivity result, not proof that the
1 ms protocol disagrees physiologically. A separately settled, release-bound
1 ms P1 checkpoint is required before quantitative 1-versus-2 ms endpoint and
fit comparison is eligible.

ED/ES remain discrete first-sustained threshold samples rather than
crossing-interpolated events. AoV/MV threshold sensitivity and disease-envelope
testing remain required. Until those are available, the current 1 mL/s, 4 ms
event policy is a declared numerical protocol choice, not a physiological
constant.

## Pressure, display, and identity boundary

Formal analysis and QC use LV transmural endpoint pressures. Each accepted ED
and ES also retains intracavitary absolute pressure and external pressure
`Pabs - Ptm`. The chamber-pressure curve shown by the Workbench is a display
projection of the same formal transmural relation plus volume-local observed
external pressure from the same accepted beat IDs. It is not an independent
absolute-pressure fit and never extrapolates beyond the observed endpoint
volume span.

The exact public source identity was byte-equal before and after acquisition.
Worker results are keyed by the complete checkpoint/release fingerprint, are
owner-scoped, and are rejected when their source identity becomes stale.

## Remaining validation work

1. Build a separately settled 1 ms source and repeat endpoint, fit, and wall-
   clock comparisons.
2. Sweep AoV/MV flow thresholds and sustained-event duration.
3. Validate representative contractility, diastolic-stiffness, afterload,
   pericardial, right-heart, and stenotic-valve envelopes.
4. Design and validate lesion-specific event semantics before enabling MR/AR.
5. Validate a closed-loop work boundary in a separate protocol before adding
   any conventional PRSW output.

## Method references

- Klotz S, et al. *Single-beat estimation of end-diastolic pressure-volume
  relationship*. Am J Physiol Heart Circ Physiol. 2006.
  <https://doi.org/10.1152/ajpheart.01240.2005>
- Burkhoff D, Mirsky I, Suga H. *Assessment of systolic and diastolic
  ventricular properties via pressure-volume analysis*. Am J Physiol Heart
  Circ Physiol. 2005. <https://doi.org/10.1152/ajpheart.00138.2005>
- Karunanithi MK, et al. *Estimation of preload recruitable stroke work*.
  J Am Coll Cardiol. 2000.
  <https://doi.org/10.1016/S0735-1097(99)00566-5>
