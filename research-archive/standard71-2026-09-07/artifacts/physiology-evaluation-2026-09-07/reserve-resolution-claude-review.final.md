## Code verdict

**Scoped approval: yes.** The research-only step option does what it claims, and production stepping is untouched. At the default 2 ms the override delegates to the base class unchanged. At 1 ms each sub-request lands in the base's single-tick projection path with the solver's dt set to the request length, because the base tick of 2 ms exceeds 1 ms. Both fork types carry the step, the label and identity hash are honest, and the 1 ms run's settlement landmark deltas dropping about tenfold confirm that finer stepping actually happened.

Findings, none blocking:

- **Missing equivalence test.** The suite proves 2 ms structural stepping matches the canonical 2 ms runner, but has no 1 ms analogue. The 1 ms claim currently rests on step size, not on trajectory equality. Add the mirror of the existing compliance test at 1 ms.
- **Inert constructor argument.** The endpoint readback advances through the ordinary presentation path, not the structural override, so the copy's step setting does nothing. The 1 ms readback comes entirely from the sample interval. Harmless, but the runner implies otherwise.
- **Provenance discontinuity.** The new protocol label is hashed unconditionally, so a 2 ms re-run no longer shares an identity hash with the saved 2 ms result despite identical numerics. Document this or make the label conditional.
- **Lost diagnostics on mid-loop failure.** A non-advanced sub-request is returned as-is, dropping the substep records already committed. The base has the same behaviour and the caller discards the branch, so impact is nil.
- **Degenerate final step risk.** If a caller's target differs from the last grid point by ulps, the loop issues a near-zero-length step. The reserve protocol's fixed 10 ms targets avoid this. A snap tolerance would remove the wart.

## The 1 ms result is in

The fine run finished. Resolution does not rescue the failed criterion, and I would not have expected it to.

| Quantity | 2 ms | 1 ms |
|---|---:|---:|
| Mean RA drop, hypovolemic (mmHg) | 0.955864 | 0.955884 |
| CO drop, hypovolemic | 19.97% | 19.96% |
| RV EDV drop, hypovolemic | 21.74% | 21.73% |
| RV ED Ptm drop, hypovolemic (mmHg) | 1.214 | 1.129 |
| Rest RV ED Ptm (mmHg) | 2.501 | 2.425 |
| Rest mean PAP (mmHg) | 17.89 | 17.87 |
| Weiss tau (ms) | 32.04 | 31.74 |
| AV ET (ms) | 258 | 255 |

The mean atrial pressure change is the most dt-robust quantity in the whole criterion set. The least robust is the ED transmural pressure, an instantaneous landmark at inlet closure, which moves by about 7% of its own change with dt. If any floor needs numerical justification it is that one, not the atrial mean.

## Scientific view on the criteria

The eight per-side criteria are not independent. CO is a circulation quantity, identical across sides to four decimals, so demanding it "for both ventricles" is duplication. The CO/pressure slope and the pressure floor pull in opposite directions on the same pair of numbers: for a fixed CO change, a smaller pressure change fails the floor and raises the slope.

The 1 mmHg RA floor has a physiological problem, not just a provenance gap. Under fixed control, a TBV reduction shifts the venous return curve. The RA pressure change is the intersection with the cardiac function curve. A heart on the steep part of that curve, with low RA pressure and a compliant venous bed, gives a large CO and EDV response with a small RA pressure change. That is what this model shows. A symmetric absolute floor selects against exactly that configuration and passes a stiffer coupling more easily. It is also scale-blind: 1 mmHg is about 12% of the LA mean but about 31% of the RA mean. I looked up no literature for this. It is standard venous return physiology plus the model's own numbers, and no clinical protocol matches a fixed-control whole-circulation TBV step anyway.

Three things this protocol must not be confused with. Whole-circulation TBV response measures series coupling of both ventricles, pulmonary bed, pericardium and venous compliance under a fixed arterial load with no reflexes. Isolated ventricular contractility is an end-systolic or preload-recruitable-work property and belongs to the existing PV family, not to a ±12% TBV step. Bedside fluid responsiveness is a bolus with intact reflexes in patients, defines responders by a 10 to 15% stroke volume rise, and is notoriously unpredicted by CVP change. Its cutoffs should not be imported, and the report already says so.

**Minimal prospective policy** I would put forward for 1-of-2 review. This is a proposal, not an approval, and it is not yet concretely specified anywhere in the repo:

- Keep the protocol and label it a construction response check, never a reserve or normality claim.
- Sign-consistency in each direction: CO once, per-ventricle EDV and ED transmural pressure, per-atrium mean pressure, plus the existing same-sign EDV/Ptm rule.
- Magnitude floors only as numerical resolvability: each change must exceed a declared multiple of the endpoint's settled beat-to-beat variation and the measured 2 ms versus 1 ms difference of that quantity. The 0.15 mmHg atrial closure tolerance already in the same file is a natural anchor. Report both noise terms next to every criterion.
- Any larger margin, such as the current 2 to 3% CO and EDV fractions, is a declared design choice and must be labelled as such.
- Report the CO/pressure slope but drop it as a pass criterion.

Under this policy the 4935 point would pass. That is a consequence, not the motivation, and keeping the 1 mmHg floor while moving the operating point remains a legitimate design decision if the team accepts what it selects for.

**Smallest next step.** Add the 1 ms equivalence test. Then write the policy above as a new analysis-owned policy file with its own identifier, leave the shared floors untouched, run it as readback against the two saved 4935 results, and submit that for external review. No new simulations are needed for that step. Adoption of 4935 stays separate: mean PAP, RV ICT and Tei warnings are unresolved regardless of the reserve verdict.