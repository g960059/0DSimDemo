# Periodic multi-load valve-event PV locus result

Status: all nine independent loads established canonical P1 and qualified
periodic work; V1 valve-event locus correctly withheld because the frozen
within-cycle event-order contract was wrong and two loads had extra crossings

## Lineage

The initial preregistration was committed as `bb1edcb5`. Its 0.74 load was
rejected by input validation before model initialization or numerical output.
The preflight correction to 0.75 and its negative output-inspection record were
committed as `efa2b662` before the first numerical run.

The retained artifact is
[`evidence/periodic-valve-event-locus-v1.json`](evidence/periodic-valve-event-locus-v1.json),
with canonical payload SHA-256
`685926b2427fa20045b267f4633a3797fe021ae75155ad47e16bfa0b6fbd9316`.

No event-order rule, required crossing count, load, settlement rule, line-fit
threshold, pressure basis, or admission flag was changed after inspecting the
nine-load output.

## Numerical result

All nine independent cold starts reached canonical full-state P1 within the
frozen 250-cycle bound. Every run also passed finite/conservation/event checks,
exact terminal checkpoint round trip, and the previously admitted
biventricular periodic-work qualification.

| TBV ratio | TBV (mL) | P1 cycle | Periodic work |
| ---: | ---: | ---: | --- |
| 0.75 | 4200 | 188 | biventricular qualified |
| 0.82 | 4592 | 186 | biventricular qualified |
| 0.90 | 5040 | 108 | biventricular qualified |
| 0.96 | 5376 | 25 | biventricular qualified |
| 1.00 | 5600 | 71 | biventricular qualified |
| 1.06 | 5936 | 136 | biventricular qualified |
| 1.12 | 6272 | 150 | biventricular qualified |
| 1.18 | 6608 | 154 | biventricular qualified |
| 1.24 | 6944 | 151 | biventricular qualified |

The exact nine-point load set, bilateral coverage, complete model-condition
identity, and common protocol identity all passed. The failure is therefore
not a settlement, range, provenance, or checkpoint failure.

## V1 event-order failure

V1 required inlet-valve closure to precede semilunar-valve closure as scalar
times inside one periodic-runner cycle. That assumption is false because the
runner's one-second coronary/sinus window is not a ventricular beat boundary.
Across the nine results:

- LV inlet closure occurred at phase 0.778--0.900, while AoV closure occurred
  at phase 0.067--0.121;
- RV inlet closure occurred at phase 0.778--0.901, while PV closure occurred
  at phase 0.092--0.211; and
- the physiological sequence is therefore inlet closure late in one retained
  cycle, followed by semilunar closure early in the next periodic copy.

Simply comparing absolute times inside one storage window reverses the event
order. The correct abstraction is a circular periodic orbit with a declared
beat pairing, not a linear array that happens to begin at the runner's cycle
boundary.

The trace-boundary change itself worked as intended: every result had an exact
preceding-cycle terminal sample and a complete first accepted segment. The
problem is semantic alignment, not missing samples.

## Additional crossing observation

Seven loads had exactly one positive-to-nonpositive crossing for every valve.
Two did not:

- TBV ratio 0.82 had two PV closure crossings; and
- baseline ratio 1.00 had two TV closure crossings.

The retained compact V1 artifact intentionally stores the crossing counts and
first frozen candidate but not an after-the-fact preferred second event. The
current evidence therefore cannot decide whether the extra crossing is a
meaningful secondary forward-flow episode, an E/A-phase separation, or
near-zero numerical chatter. Selecting whichever event gives a plausible loop
would be circular.

## Frozen decision

The executable decision remains:

```text
all nine canonical P1 runs qualified          = true
all nine periodic-work results qualified      = true
valve-event sequence qualified                = false
official Experiment event locus eligible      = false
descriptive end-ejection line evaluated       = false
ESPVR / EDPVR / PE / PVA established          = false
physiological / clinical validation established = false
```

This is a useful failure. It demonstrates why event-defined ED/ES cannot be
derived by taking the first labels found in an arbitrary storage window, even
when every underlying trajectory is periodic and numerically qualified.

## Next protocol boundary

V2 should not merely add one second to the semilunar event. It should define a
beat topologically on the circular orbit:

1. segment every valve's positive-flow episodes, including episodes that wrap
   the storage boundary;
2. identify the principal semilunar ejection episode by integrated forward
   volume, not peak sample or an arbitrary flow threshold;
3. pair its closing event with the latest inlet-valve closing event before that
   episode opens on the circular orbit;
4. retain all secondary episodes and their forward volumes as ambiguity
   evidence; and
5. fail if the principal episode is not uniquely separated or the paired
   event-defined stroke volume is negative.

The current nine loads are a development set for that rule and cannot become
confirmatory evidence retroactively. After V2 is frozen, an interleaved,
previously unobserved fixed-TBV set should be the confirmation set. Only a
passing confirmation may admit the event locus. ESPVR, passive EDPVR, PE, and
PVA remain later and separate definitions even then.
