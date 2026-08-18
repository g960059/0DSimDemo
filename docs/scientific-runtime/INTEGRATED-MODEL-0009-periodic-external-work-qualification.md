# Periodic ventricular external-work qualification

Status: analysis-level LV/RV eligibility implemented; public Output Catalog
admission remains blocked on a separately preregistered numerical-refinement
gate

## Decision

The exact capture-to-capture observer remains **PV path work**. It is not
renamed external work merely because one electrical window completed. A
separate analysis may project that path to signed ventricular external work
only when all of the following are true:

1. the canonical full accepted-state classifier established P1 over its
   required consecutive cycles;
2. the measured terminal cycle is the latest cycle in that P1 evidence chain;
3. conservation, finite-state, event-identity, calcium-owner, and all-MCS-off
   cycle checks passed;
4. every event-clipped accepted endpoint in the cycle is present without
   resampling; and
5. the terminal endpoint closes to the previous cycle's exact terminal
   endpoint in both ventricular volume and transmural pressure.

The qualifier is
`MainWireIntegratedModelPeriodicExternalWorkV1`. It consumes the existing
canonical periodic protocol rather than introducing a second settlement or
periodicity definition.

## Measurement

For each ventricle, the analysis evaluates

```text
W_path = - sum_i 0.5 * (P_tm,i + P_tm,i+1) * (V_i+1 - V_i)
```

from the previous cycle's terminal accepted endpoint through every accepted
endpoint of the current cycle. It does not add an end-to-start segment. If the
eligibility gates pass, this same signed value becomes `externalWorkMmHgMl`;
otherwise only the diagnostic `pathWorkMmHgMl` remains available.

Closure uses fixed dimensional normalizers, not instantaneous values or
physiological normal ranges:

```text
volume scale   = 100 mL
pressure scale = 100 mmHg
tolerance      = 1e-3 on the maximum normalized endpoint delta
```

The volume convention and normalized threshold reuse the canonical P1 policy.
Transmural pressure is an algebraic readback rather than an accepted-state
coordinate, so its fixed scale is stated separately. These numbers determine
numerical eligibility only; they are not a clinical threshold.

## Deliberate non-gates

A negative result is not rejected. With the declared sign convention, positive
means net work by the ventricle and negative means net work on the ventricle.
Discarding the latter would remove physically meaningful failure, assistance,
and unusual-loading states.

Valve closure events separately own ED/ES annotations. Their availability is
not required for the closed-path line integral itself. Event completeness and
cyclic pairing will become mandatory where an ESPVR/EDPVR or PVA construction
uses those landmarks.

Likewise, self-intersection does not make a signed line integral undefined;
oppositely oriented subloops contribute algebraically. Self-intersection is a
mandatory later gate for any renderer or PVA algorithm that claims one unsigned
filled region. Keeping these contracts separate avoids storing an entire PV
polyline in the exact model checkpoint solely for an EW test.

## Identity and publication boundary

This work does not change the numerical equations, accepted state, Standard
checkpoint, fixture, or public output ABI. It therefore does not mint a new
`modelId`. Standard-63 continues to expose only LV/RV transmural PV path work.
The analysis result records its own qualification and policy identities, a
full-fixture model-condition hash independent of numerical `dt`, the source
protocol hash, cycle index, endpoint residuals, gate results, and the explicit
negative physiological/clinical-validation claims.

The compact evidence runner hashes the complete raw terminal trace and records
the terminal exact-checkpoint digest:

```text
npm run verify:scientific:periodic-external-work-v1 -- \
  --execution-purpose canonical-evidence \
  --dt 0.002 \
  --maximum-cycles 250 \
  --output /tmp/periodic-external-work-v1.json
```

Bounded-smoke and fixed-horizon runs may report raw path work and closure
diagnostics, but they cannot establish EW.

## Current numerical characterization

Canonical P1 runs at nominal steps 0.01, 0.005, 0.002, and 0.001 s all passed
the single-run periodic and explicit PV-closure gates. The observed work
changed by about 1.9% for LV and 2.9% for RV from 0.01 to 0.005 s, about 0.94%
for LV and 1.89% for RV from 0.005 to 0.002 s, and about 0.286% for LV and
0.690% for RV from 0.002 to 0.001 s. This is a convergent trend, but these are
characterization results rather than a post-hoc acceptance threshold.

Consequently, the qualifier is implemented and useful inside official
Experiments, but catalog promotion remains blocked. The model-condition
identity independent of `dt` is now frozen. The next change must preregister a
refinement pair or sequence, a near-zero policy, and an acceptance tolerance
before inspecting that new admission evidence. A failed preregistered gate
must remain failed rather than being relaxed to admit the observed result.

## Literature boundary

The pressure-volume loop's external-work interpretation and the separation of
external work from potential energy/PVA follow Suga's ventricular energetics
framework, including the original pressure-volume-diagram treatment
([Suga 1979](https://www.jstage.jst.go.jp/article/jjphysiol1950/29/3/29_3_227/_pdf))
and subsequent experimental PVA-to-oxygen work
([Suga et al. 1987](https://pubmed.ncbi.nlm.nih.gov/3591971/)). Those canine
preparations support the measurement concept; they do not validate this
model's magnitude, human population range, or a future MVO2 conversion.
