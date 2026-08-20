# Periodic five-wall mechanical-port ledger Engineering V1

Status: Engineering analysis only. It is not an official Standard output and
does not establish PVA, myocardial oxygen consumption, ATP use, heat, or a
Land active stored-energy potential.

## Decision

The mechanics ledger precedes the next passive-equilibrium solver revision.
The immediate purpose is to establish an independent accounting surface for
the mechanics already accepted by Integrated V3. A future passive solver and
future systolic-relation protocols can then be compared against this ledger
without making one of those protocols the ledger owner.

The implementation has two new owners:

- `main-wire-five-wall-mechanical-port-ledger-engineering-v1` is a pure
  accepted-interval reduction;
- `main-wire-integrated-model-periodic-five-wall-mechanical-port-ledger-engineering-v1`
  restores an exact periodic checkpoint and supplies the accepted interval
  path.

Neither owner changes accepted model state, the frozen periodic cycle runner,
the Standard registry, or Studio output ABI.

## Mechanical quantities

For wall material volume `Vw`, accepted fibre-log-strain increment `de`, and
right-endpoint Kirchhoff stress `sigma`, the discrete work on the wall is

```text
W_wall_BE = sum sigma_(i+1) * (e_(i+1) - e_i) * Vw
```

The ledger keeps total, Land-active, equilibrium-passive, and parallel-SLS
stress work separately. The Land term is only a mechanical port quantity.
Negative work on the wall is reported as positive active mechanical delivery;
positive work on the wall is retained as active mechanical absorption. The
split is made per accepted interval. No continuous power zero crossing or
instantaneous active power is inferred.

Equilibrium-passive stored-energy change, equilibrium-passive backward-Euler
remainder, SLS stored-energy change, physical SLS dissipation, backward-Euler
numerical SLS dissipation, and SLS discrete-balance residual remain separate.
The accepted SLS previous-storage readback must exactly equal the preceding
accepted endpoint's next-storage readback.

## Cavity and pericardial ports

For every chamber, the implementation retains both

```text
W_cavity_BE   = sum P_(i+1) * (V_(i+1) - V_i)
W_cavity_trap = sum 0.5 * (P_i + P_(i+1)) * (V_(i+1) - V_i)
```

using transmural chamber pressure. Their difference is a quadrature
difference, not physical dissipation. Backward-Euler cavity work is used only
for the discrete cavity-wall conjugacy residual. Trapezoidal work is the
accepted-endpoint continuous-path approximation.

Common-pericardium pressure work is integrated against the sum of the four
chamber-volume increments and is kept outside transmural wall/cavity work.
Backward-Euler and trapezoidal pericardial work, stored-energy change, and both
remainders are retained independently. This coordinate exactly matches the
current pericardium owner: its heart volume is the four chamber blood volumes
plus five fixed wall material volumes. Coronary compartment blood volume is not
an additional coordinate of that owner.

The shared septum is not allocated to LV or RV. The ventricular conjugacy
check compares the combined LVFW, SEP, and RVFW work with combined LV and RV
cavity work. LV PVA and RV PVA are not defined by this ledger.

## Accepted-path replay

The periodic adapter requires an input that declares canonical period-1 status
and verifies that a newly constructed fixture reproduces the input condition
and protocol identities. It also exact-round-trips the supplied checkpoint.
These are consistency gates, not source authentication: source provenance is
not verified, no historical qualification is transferred, and no official
eligibility is created. The adapter also does not establish periodicity; it
retains only the caller's period-1 declaration after those consistency gates.
The pure reducer likewise does not authenticate the provenance of accepted
endpoints supplied to it. The adapter then:

1. restores the source terminal checkpoint from canonical JSON;
2. checkpoints the restored state and requires exact equality;
3. runs one unmeasured bridge cycle to obtain the missing material readback at
   the left endpoint of the measured path;
4. runs one measured cycle, collecting committed successful accepted steps
   without resampling;
5. requires contiguous revision, time, readback, SLS-storage, event, and
   conservation lineage;
6. measures the ledger over the second cycle only;
7. checkpoints and exact-round-trips the terminal continuation state.

The analysis cycle loop mirrors the existing canonical one-cycle executor.
A real-provider test compares its plain result projection and terminal
checkpoint exactly with the canonical executor. The mirror exists to avoid
adding an observer callback to the frozen Standard owner.

## Material-volume binding

Wall material volumes are not accepted from the periodic caller. The adapter
binds LA and RA volumes and the LVFW, SEP, and RVFW TriSeg material volumes
directly to `NORMAL_ADULT_FIVE_WALL_PRIOR_V1`, together with its prior ID and
parameter identity hash. The binding also carries the live mechanics contract,
provider, parameter-set, parameter-identity, and state-schema identity. Every
accepted mechanics trial must match that live provider identity. The pure
reduction carries the complete binding in its result but does not claim that an
arbitrary caller-supplied binding is official.

Integrated V3 converts pressure with its model-native `133.322 Pa/mmHg`; the
ledger uses the same value so the wall/cavity conjugacy residual compares the
model's own units. This deliberately does not substitute the slightly more
precise metrological conversion used by unrelated literature helpers.

The canonical adapter reconstructs equilibrium-passive stress as total minus
Land-active minus SLS overstress because no independent equilibrium-passive
stress field exists in the accepted readback. Consequently, its stress-assembly
residual is an input-consistency field and is algebraically zero on the
canonical adapter; it is not an independent constitutive verification.

## Verification scope

Engineering V1 includes:

- analytic synthetic tests for BE and trapezoidal work, storage, dissipation,
  active delivery/absorption, and overflow rejection;
- rejection of discontinuous endpoint readback and discontinuous SLS storage;
- real-provider parity between the canonical cycle and the observer mirror;
- checkpoint restore, bridge-cycle exclusion, measured-cycle coverage, model-
  owned wall-volume binding, and terminal checkpoint round-trip;
- machine-readable false claims for official/public output, PVA, oxygen use,
  ATP/heat, physiological validation, and clinical validation.

This PR does not perform a new long canonical periodic qualification run and
does not create an evidence artifact.

## Next work

The next numerical work item is a versioned passive-equilibrium solver V3
comparison. It should preserve the V2 absolute-energy Armijo result as
historical evidence and compare stable componentwise energy-difference and
force-merit globalization policies on the frozen difficult points. Only after
the passive surface is numerically qualified should transient isochronal,
valve-closure, and support-envelope relations be compared on the same loop
family. Method-specific chamber-projected PVA can follow; an unqualified
generic `PVA` alias cannot.
