Wrapping up: I've read the two policies, the pressure-rate refactor and its retained test, the assessor, the new test, the profile/comparison/gate-role code, the fixed-tone settlement and reserve protocol internals, the ASE-cited tau observer, and the v2 candidate report against both raw result files. Verdict follows.

# Verdict: APPROVE (scoped)

**Approval scope.** The two new policy modules, the extraction of the shared pressure-rate observation math with the production wrapper retained, the read-only assessor tool, and the regression test. I also accept the candidate report's label "eligible-for-exact-model-promotion" as a scientific-eligibility statement for this one construction only (research construction v1, HR 70, TBV 4935, BSA 1.9, zero intrathoracic reference). Not approved: any mint or public release, HR 60 material, clinical normality, or treating the inherited reserve floors as physiology.

## What I verified

**Rest policy.** The six operating criteria are correctly labelled by provenance. CI, mean RAP and mean PAP are taken verbatim from ESC/ERS 2022 Table 11. The Ao bounds are explicitly declared as retained engineering guards rather than Herbert-derived. The LVEDP ceiling cites the ASE 2025 Table 1 inequality (>16 abnormal) and states that native MV flow cessation is not catheter LVEDP. Legacy checks keep their roles: numerical-quality and construction-guard block on failure, reference-warning blocks only on invalid or sign-impossible values, and the 16 legacy physiological-target corridors are no longer gates. All 16 are still observed and validated for finiteness through the profile comparison, so nothing becomes silently unobserved. The anatomy rule requires both sex strata and routes an exception to "demographic-review-required", which the tool treats as not eligible. The status ordering (unresolved before failed before demographic review before passed) is right.

**Reserve policy.** I checked the sensitivity algebra by hand. Linear criteria use |ΔB|+|ΔE|. Fractional residual sign·(E−B) − f·B has cross-grid variation bounded by |ΔE| + |sign+f|·|ΔB|, which is what the code computes (test values .197 and .203 confirm). The CO/pressure secant residual bound sums the CO and pressure sensitivities with the slope coefficient. Recomputed screens guard against stale serialized deltas within 64 ulp. Direction is required on both grids. Center coherence and protocol/TBV scale binding are enforced.

**Pressure-rate refactor.** The wrapper still owns identity, period-1 and dt-halving checks; the raw comparator only enforces dt halving and throws otherwise. The existing wrapper test exercises all of that unchanged.

**Tool.** Same-construction SHA, 2 ms/1 ms hard binding, cold independent period-1, conservation and all-off checks, reserve step-protocol marker, own checkpoint evidence, beat/HR binding, write-once output, and implementation file hashes. Both grids must pass rest independently.

**Candidate numbers from the v2 report:**

| Check | Coarse 2 ms | Fine 1 ms | Bound |
|---|---:|---:|---|
| Net CI | 2.952 | 2.953 | 2.5–4 |
| Mean RAP | 3.08 | 3.08 | 2–6 |
| Mean PAP | 17.89 | 17.87 | 8–20 |
| Native LVEDP | 10.92 | 10.94 | ≤16 |
| LVEF (women lower limit .55) | .5575 | .5578 | both strata |
| Weiss tau ms | 32.0 | 31.7 | usability only |
| Max two-grid dP/dt rel. diff. | RV max 2.9% | | ≤5% |
| Right hypovolemic ΔRA mmHg (margin vs sensitivity) | .956 vs .0073 | | direction only |
| Right hypovolemic ΔPtm (margin vs sensitivity) | .879 vs .085 | | floor .25 |

Warnings correctly remain visible in the JSON: PAP minimum 12.03 above 12, ICT 89–93 ms, Tei .70–.73, LV ±dP/dt outside the legacy corridors.

## Non-blocking findings (recommended, small)

- **Surface the warnings at the top of the report.** The report leads with "eligible" while the PAP-minimum excess and the four historical warnings sit hundreds of lines down, and the console summary omits them entirely. Add one top-level array listing profile entries with outside-range status plus historicalWarnings ids. This keeps the "visibly strict warnings" claim honest without a framework.
- **Reserve test pass case is a clone.** The only passing fixture is `reserve(a, structuredClone(a))`, so sensitivity is zero and the margin comparison is never exercised on a nonzero pass. Add one case with small, non-cancelling grid differences that still passes.
- **Two-grid sensitivity cannot see same-direction settlement residual.** A slow reservoir drift present on both grids cancels in the difference. The settlement policy bounds this separately, but in volume units (≤.05 mL redistributed per beat), while the smallest reserve margin is a pressure (.956 mmHg RA). The coarse hypovolemic branch also finished with a normalized landmark delta of .99 against a limit of 1.0. Consider recording the last-three-beat drift of mean RA and LA pressure in mmHg at each endpoint so this margin can be compared in its own units. This is one extra number per endpoint, not a new framework.
- **LVEF fragility.** LVEF clears the women's lower limit by .0075. A future material or step change could flip the rest status to demographic review without any real physiological change. Note it in the selection record so a flip is recognised as boundary proximity, not a regression.
- **Ao rules cite Herbert while declaring themselves not Herbert-derived.** Acceptable because the locator points at the methodological caveat, but a null source with an explicit "design choice" basis would be cleaner and would need a one-line change to the source-existence assertion.

## Evidence still needed before production binding

1. Mint the exact identity and own checkpoint for this construction, then re-run this same assessor against the minted material to show analysis parity. The current research checkpoint hashes must not be aliased.
2. Decide which grid is the production step and state it. The 1 ms run is then the sensitivity companion, not the source of truth, or vice versa.
3. Live runtime parity: the running model at the production step must reproduce the completed-beat operating values within the two-grid differences reported here.
4. The reserve endpoint traces have not been evaluated by the strict tau/ringing observers, as the REPORT already states. Record this as a declared limitation of the reserve evidence, or add the endpoint diagnostic beats to the observer input.
5. If HR 60 is ever exposed as a baseline, it needs its own coarse/fine pair through this assessor. The policy scope permits it but no HR 60 material has been assessed.

## Overall judgment

This is scientifically defensible for what it claims. Operating targets are source-informed where sources exist and are labelled as engineering guards where they do not. Method-mismatched references stay as warnings instead of being widened into gates or quietly dropped. The reserve change replaces an unsupported universal 1 mmHg amplitude with direction plus explicit two-grid sensitivity, and it says plainly that this is not an error bound or convergence proof. The code footprint is two short policy files, one tool and one test, well short of an elaborate framework.