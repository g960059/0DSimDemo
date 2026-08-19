# Periodic pressure-basis work Engineering projection

Status: implemented Engineering projection; no official qualification, public
Output, PVA, physiological validation, or clinical validation

## Purpose

PR560 recovered the periodic ventricular transmural-boundary-work projector
from the PR558 research archive under a new, explicitly unqualified identity.
This record extends that recovery into a usable vertical slice without
transferring the archive's historical qualification.

The implementation now owns two separate layers:

1. a pure pressure-basis decomposition over a caller-ordered pressure-volume
   path; and
2. an Integrated V3 connection that retains the exact terminal accepted
   endpoint of the cycle immediately preceding the terminal cycle trace.

The first layer is repeatable numerical Engineering work. The second layer
supplies a real-model source path and condition identity. Neither layer is a
Confirmatory admission or a public model Output.

## Pressure and work definitions

For each ventricle and each retained path point:

```text
P_external = P_cavity_absolute - P_ventricular_transmural

W_cavity     = - integral P_cavity_absolute dV
W_transmural = - integral P_ventricular_transmural dV
W_constraint = - integral P_external dV

residual = W_cavity - (W_transmural + W_constraint)
```

All three work terms use the same caller-ordered volume endpoints and the same
accepted-endpoint trapezoidal increment already owned by Integrated V3. A
counter-clockwise ventricular loop is positive. No synthetic end-to-start
segment is inserted.

`W_constraint` is named **external-constraint exchange**. It is not the generic
ventricular external work and must not be confused with `W_transmural` or the
absolute-pressure catheter PV-loop area.

The numerical decomposition gate is:

```text
abs(residual) <= 1e-8 mmHg*mL
```

This is a floating-point consistency tolerance, not a biological normal range.
It retains the archived predeclared absolute decomposition limit. The current
two-cycle real-model regression has substantial headroom, but a future
high-resolution Confirmatory policy must freeze its own rounding-error bound
before producing evidence rather than silently widening this Engineering gate.

## Pure Engineering projector

The pure projector accepts:

- one start-point candidate; and
- an ordered sequence of endpoint candidates containing LV/RV volume,
  absolute cavity pressure, and ventricular transmural pressure.

It reports, independently for LV and RV:

- raw path work in all three pressure bases;
- direction of each signed path integral;
- endpoint closure in all three pressure bases;
- gated boundary work;
- external-constraint exchange;
- the decomposition residual; and
- explicit failure reasons.

Finite raw path work is retained even when a pressure-volume boundary is open.
Boundary work is emitted only when all three paths are finite, all three
endpoint pairs close within the inherited numerical closure tolerance, and the
decomposition residual passes. One chamber may remain available when the other
overflows or fails closure.

The projector deliberately does not authenticate that its points are accepted
solver endpoints. Its machine-readable result keeps all of these false:

```text
acceptedEndpointIdentityVerified
periodicityEstablished
sourceProvenanceVerified
historicalQualificationTransferred
officialQualificationEstablished
publicOutputEstablished
pvaEstablished
physiologicalValidationEstablished
clinicalValidationClaimed
```

## Integrated V3 connection

`runMainWireIntegratedModelPeriodicSteadyV3` now retains
`terminalCycleStartTraceSample`, defined as the exact terminal accepted trace
sample of the cycle immediately preceding `terminalCycleTrace`.

This point is required because the retained terminal trace contains accepted
endpoints after the cycle boundary; it does not otherwise contain the left
endpoint of its first segment. The connection does not alter, resample, or add
points to the trace.

The periodic result also owns a model-condition identity hash over the
hemodynamic inputs, ventricular contractility, mechanism inputs, provider
identity, rhythm configuration, all-off support configuration, and coronary
step input. Protocol identity and model-condition identity remain separate.
Their payloads intentionally overlap: a condition change moves both hashes,
while a numerical protocol-only change can move the protocol hash without
changing the condition hash.

Each periodic run attaches:

- `terminalTransmuralBoundaryWorkEngineering`; and
- `terminalPressureBasisDecompositionEngineering`.

With only one executed cycle, the prior endpoint is unavailable and both
layers fail closed. With two or more cycles, the raw three-basis path
integrals and decomposition residual are available when their finite guards
pass. Gated boundary work still depends on endpoint closure. Merely attaching
the result to Integrated V3 does not establish a periodic orbit or promote the
child Engineering projections.

## Verification included in this implementation

Synthetic tests cover:

- exact cavity/transmural/constraint decomposition;
- constant external-pressure offset;
- positive and negative constraint exchange;
- open pressure-basis boundaries without a synthetic close;
- finite-input work overflow contained to one ventricle;
- derived external-constraint pressure overflow;
- missing path endpoints; and
- trace-sample helper rejection of nonfinite values.

A real-model regression additionally executes two bounded-smoke cycles and
checks:

- exact prior-cycle endpoint time and cycle identity;
- distinct protocol and condition hashes;
- finite LV/RV path work in all three bases; and
- a finite decomposition residual within the Engineering tolerance.

The real-model regression is construction verification. It is not a settled
normal-adult result, a refinement admission, or validation against experiment.

## Next boundary

This vertical slice is sufficient for repeatable Engineering inspection. A
future Confirmatory release would still require a new preregistration and
immutable evidence lineage covering at least:

- canonical periodic source ownership;
- pressure-basis closure under declared PEEP and pericardial conditions;
- numerical refinement and direction stability;
- failure retention and artifact integrity; and
- a separately justified public Output contract.

PVA remains downstream of qualified systolic and passive reference relations.
No generic `PVA`, potential energy, myocardial oxygen consumption, ATP, or
efficiency alias may be introduced from this decomposition.
