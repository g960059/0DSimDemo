# Derivations: chamber geometry (geomChi) and the EDPVR

Step-by-step physical/mathematical working behind the M12-lite calibration, preserved so the
*reasoning* (not just the landed numbers) survives. Companion to `m12-lite-calibration-journal.md`
(narrative) and `parameter-survey.md` (evidence base).

- **Section A — physical / physiological derivations** (claude1): the thick-sphere Laplace factor,
  the EDPVR pressure law + the geomChi diastolic-stiffening artefact, the Klotz EDPVR, and the
  ceiling-vs-realised stress distinction.
- **Section B — engine / numerical derivations** (codex1): how these enter the
  solved state, dimensional bookkeeping in code, and the sweep arithmetic.

Units: engine pressures **mmHg**; stress **Pa** (`MMHG_TO_PA = 133.322`); state volumes **mL = cm³**.
Section A's hand arithmetic uses radii in **cm**; the engine converts geometry volumes to **m³**
(`ML_TO_M3 = 1e-6`), so code radii are **m**. All radius ratios used in the pressure law are
dimensionless, so the cm-vs-m choice cancels. Geometry uses an equivalent thick-walled sphere:
cavity `Veff = V − V0`, wall volume `Vw`.

---

## A. Physical / physiological derivations  [claude1]

### A1. The thick-sphere Laplace factor: geomChi = (rᵢ+rₒ)² / (4 rᵢ²)

**Setup.** The chamber model converts wall (fibre) stress σ to transmural cavity pressure via

  Ptm = geomChi · (2h/rm) · σ,  with h = rₒ − rᵢ (wall thickness), rm = (rᵢ+rₒ)/2 (mid-wall radius).

We want the *physically correct* geomChi for a thick-walled sphere.

**Derivation (exact global force balance).** Take a thick spherical shell, inner radius rᵢ, outer
radius rₒ, cavity pressure P, external pressure 0. Cut it into two hemispheres through a diametral
plane and balance forces along the axis normal to the cut:

- Internal pressure acts on the **projected inner area** πrᵢ² → separating force = P·πrᵢ².
- The mean circumferential (hoop) wall stress σ̄ acts on the **annular wall cross-section** π(rₒ²−rᵢ²)
  exposed by the cut → restoring force = σ̄·π(rₒ²−rᵢ²).

Equilibrium:

  P·πrᵢ² = σ̄·π(rₒ²−rᵢ²)  ⟹  **P = σ̄·(rₒ²−rᵢ²)/rᵢ²**   …(exact; independent of the through-wall stress profile)

Now match the model form P = geomChi·(2h/rm)·σ̄. First simplify the model's geometric factor:

  2h/rm = 2(rₒ−rᵢ) / [(rᵢ+rₒ)/2] = 4(rₒ−rᵢ)/(rᵢ+rₒ).

Equate the two expressions for P (σ ≈ σ̄):

  geomChi · 4(rₒ−rᵢ)/(rᵢ+rₒ) = (rₒ²−rᵢ²)/rᵢ² = (rₒ−rᵢ)(rₒ+rᵢ)/rᵢ²

  geomChi = (rₒ−rᵢ)(rₒ+rᵢ)/rᵢ² · (rᵢ+rₒ)/[4(rₒ−rᵢ)]

  **geomChi = (rᵢ+rₒ)² / (4 rᵢ²)**   ∎

**Thin-wall sanity check.** As rₒ → rᵢ: geomChi → (2rᵢ)²/(4rᵢ²) = 1, and Ptm → 1·(2h/rm)·σ = 2σh/r —
the textbook thin-wall Laplace law for a sphere, σ = P·r/(2h) [standard mechanics; Regen 1990 for the
LV-specific treatment]. So geomChi = 1 is the thin-shell limit and geomChi > 1 grows with wall thickness.

**Numerics.** Cavity sphere radii from volume: rᵢ = (3·Veff/4π)^(1/3), rₒ = (rᵢ³ + 3·Vw/4π)^(1/3).

*LV reference* (Veff = Vref−V0 = 120−10 = 110 mL, Vw = 150 mL):
- rᵢ = (3·110/4π)^(1/3) = (26.2606)^(1/3) = **2.9724 cm**
- rₒ = (26.2606 + 3·150/4π)^(1/3) = (26.2606 + 35.8099)^(1/3) = (62.0705)^(1/3) = **3.9591 cm**
- geomChi = (2.9724+3.9591)² / (4·2.9724²) = (6.9315)² / 35.341 = 48.046/35.341 = **1.3595**
  → model `geomChi = 1.359637` ✓ (h/r ≈ 0.33, a genuinely thick wall).

*RV reference* (Veff = 135−15 = 120 mL, Vw = 55 mL):
- rᵢ = (3·120/4π)^(1/3) = (28.6479)^(1/3) = **3.0600 cm**
- rₒ = (28.6479 + 3·55/4π)^(1/3) = (28.6479 + 13.1303)^(1/3) = (41.7782)^(1/3) = **3.4699 cm**
- geomChi = (3.0600+3.4699)² / (4·3.0600²) = (6.5299)² / 37.453 = 42.639/37.453 = **1.1385**
  → model `geomChi = 1.138505` ✓ (thinner wall than LV — RV geomChi closer to 1, as expected).

**Why the old 0.36 / 0.28 was wrong, and what it was hiding.** The physical factors are LV 1.3595,
RV 1.1385. The old values 0.36 / 0.28 are **3.78× / 4.07× too low**. They were not physical — they
were absorbing the inverse of the legacy `lvTmaxScale = 4.5` Tmax0 fudge **on the active side only**:
the active stress→pressure gain is geomChi·Tmax0, and 0.36 × (85 kPa × 4.5) = 0.36 × 382.5 kPa ≈
138 (vs the honest 1.3595 × 85 kPa ≈ 116 — within ~19%, the rest taken up by activation fractions).
So systole looked roughly right with the fudge. **But geomChi multiplies the passive term too** (A2),
and σ_pas had no compensating fudge — so the under-scaled geomChi was silently masking a too-stiff
passive law. Correcting geomChi to its physical value without recalibrating σ_pas is exactly what
exposed (and 3.8×-amplified) the diastolic problem.

*Cite:* thin-/thick-wall sphere equilibrium is standard continuum mechanics; LV wall-stress treatment
Regen DM, "Calculation of left ventricular wall stress," *Circ Res* 1990; the single-fibre thick-sphere
chamber lineage is Arts/Bovendeerd (CircAdapt), *Am J Physiol Heart Circ Physiol* 2005.

### A2. EDPVR pressure law and the geomChi diastolic-stiffening artefact

**The law.** Passive fibre stress and its mapping to cavity pressure:

  σ_pas = sigmaPas0 · (exp(bPas·(λ − lambdaPas0)) − 1),  λ = rm/rm,ref  (stretch; λ=1 at Vref)
  Ptm[Pa] = geomChi · (2h/rm) · σ_pas
  EDP[mmHg] = Ptm / 133.322

**Worked at EDV 120 (λ = 1.0), old passive params** sigmaPas0 = 2000 Pa, bPas = 10, lambdaPas0 = 0.85:

- σ_pas = 2000·(exp(10·(1.0−0.85)) − 1) = 2000·(exp(1.5) − 1) = 2000·(4.4817 − 1) = **6963 Pa**
- 2h/rm = 2·(3.9591−2.9724)/3.4658 = 2·0.9867/3.4658 = **0.5694**
- EDP = geomChi · 0.5694 · 6963 / 133.322 = geomChi · 29.74 mmHg

  → at geomChi 0.36: EDP = **10.7 mmHg** (≈ Klotz-correct for EDV 120!)
  → at geomChi 1.3595: EDP = **40.4 mmHg** (≈ 4× too stiff)

Since EDP ∝ geomChi (all else fixed), the stiffening ratio is exactly the geomChi ratio
1.3595/0.36 = **3.78×**. This is the entire artefact: tripling geomChi for the *force* correction
tripled-plus the diastolic pressure, because σ_pas rides the same geomChi.

**The compensation.** To restore the original (≈Klotz-correct) passive pressure at the new geometry,
hold the *effective* passive scale geomChi·sigmaPas0 constant:

  sigmaPas0,new = sigmaPas0,old · (geomChi,old / geomChi,new)

- LV: 2000 · (0.36/1.3595) = **≈ 530 Pa**   (effective scale 1.3595·530 ≈ 720 = 0.36·2000)
- RV: 2000 · (0.28/1.1385) = **≈ 492 Pa**

The **RV landed on this simple compensation** (sigmaPas0 492, bPas 10). The **LV did NOT** — it was
given a full Klotz re-fit (sigmaPas0 200.13, bPas 23.2, lambdaPas0 0.9025) because the steep
high-volume limb (A3) is required for the MR/volume-overload cases; the simple bPas-10 compensation
is too gentle above EDV 120 (see `m12-lite-calibration-journal.md` §5).

> **Note (`lambdaPas0` is not purely passive — see §B3).** In the code `lambdaPas0` enters **both**
> σ_pas **and** the active length-tension term `f_iso = clamp((λ − lambdaPas0 + 0.3)/0.35, 0, 1)`.
> So the LV `lambdaPas0` 0.85 → 0.9025 shift also nudged active stress at sub-reference stretches
> (at λ = 1 it is clamped to 1, so no effect at the operating beat; at λ ≈ 0.85 it cuts f_iso ~0.86→0.71).
> It was therefore fit as a **coupled** passive+active parameter, not a pure EDPVR knob. (The large
> family-2 EF collapse was the separate `Vref`→rmRef denominator effect, §B3.)

### A3. The Klotz EDPVR (the diastolic target)

**Single-beat construction** from one operating point (Vm, Pm), An = 27.8, Bn = 2.76 [Klotz 2006]:

- Unloaded volume: V0 = Vm·(0.6 − 0.006·Pm)
- Volume at 30 mmHg: V30 = V0 + (Vm − V0)/(Pm/An)^(1/Bn)
- Curve: **EDP = 30 · ((V − V0)/(V30 − V0))^2.76** (passes through (V0, 0) and (V30, 30))

**Anchored at the normal operating point (Vm = 120 mL, Pm = 10 mmHg):**

- V0 = 120·(0.6 − 0.006·10) = 120·0.54 = **64.8 mL**
- single-beat formula: V30 = 64.8 + 55.2/(10/27.8)^(1/2.76) = 64.8 + 55.2/0.6904 = **144.8 mL**
- curve-anchored (force the curve through (120,10) exactly): solve
  10 = 30·(55.2/(V30−64.8))^2.76 ⟹ V30 = **146.9 ≈ 147 mL**

(The two differ by ~1.5%; the single-beat formula is an estimator, the curve-anchored value is what
makes the curve pass the anchor exactly. We use **V30 ≈ 147**, which reproduces codex1's measured
P140 = 23.51 — confirming the value.)

**Target table** (V0 = 64.8, V30 = 147 ⟹ V30−V0 = 82.2):

| EDV (mL) | 65 (≈V0) | 100 | 110 | 120 | 130 | 140 | 150 | 147 (=V30) |
|---|---|---|---|---|---|---|---|---|
| **EDP (mmHg)** | ~0 | **2.9** | **5.8** | **10.0** | **15.8** | **23.5** | **33.1** | 30 |

(Each entry = 30·((EDV−64.8)/82.2)^2.76; e.g. EDV 140 → 30·(75.2/82.2)^2.76 = 30·0.7822 = 23.5.)

**The earlier V30 = 174 error (recorded honestly).** A first pass used the *simplified normalized*
form EDP = An·(V/V30)^Bn — a pure power of V that **omits V0**. Forcing it through (120, 10) gives
V30 = 120/(10/27.8)^(1/2.76) = **173.8 mL**, and P140 = 27.8·(140/173.8)^2.76 = **15.3 mmHg** — a
too-gentle high-volume limb. The flaw: V30 = 174 means "volume at 30 mmHg = 174 mL," implying an
over-compliant LV (physiological V30 for an LV operating at 120/10 is ~145–150 mL). The **V0-anchored
form (V30 ≈ 147, P140 ≈ 23.5)** is the correct one — the steep limb is real diastolic physiology and
is what preserves MR congestion (a dilating LV pays a steep EDP penalty → raised LAP/PCWP, the v-wave).

*Cite:* Klotz S, Hay I, Dickstein ML, et al. "Single-beat estimation of the end-diastolic
pressure–volume relationship," *Am J Physiol Heart Circ Physiol* 2006 (V0, V30, exponent Bn ≈ 2.76).
*Note:* Klotz 2006 supplies V0/V30 and Bn; the (V−V0)-anchored curve form used here is Klotz-derived
(forced through (V0,0) and (V30,30)), not the verbatim published normalized power form.

### A4. Ceiling vs realised active stress

Tmax0 is the **maximal isometric active-stress capacity** (the ceiling), reached only when every
activation fraction = 1:

  σ_act = Tmax0 · tmaxScale · contractility · a · gOver · f_iso,  with a, gOver, f_iso ∈ [0,1].

So the **realised** peak σ_act is Tmax0 times a fraction (the product a·gOver·f_iso ≈ 0.08–0.12 in
the operating beat), always far below the ceiling.

- **Ceiling (calibration target):** landed Tmax0 = **135 kPa** (LV), within the physiological peak
  active fibre-stress range **~100–150 kPa**: single cardiac myofibrils 145 ± 35 kPa [Pinto/Linke,
  *Passive and active tension in single cardiac myofibrils*, PMC1225421]; CircAdapt Sf,act ≈ 120 kPa
  [Arts 2005]; Bovendeerd ~30–110 kPa [Bovendeerd 1992]. (Contrast the retired 382.5 kPa fudge.)
- **Realised:** model peak σ_act ≈ **10–11 kPa**; in-vivo myofiber stress ED ≈ 2.2, ES ≈ 16.5 kPa
  [Genet 2014]. *Caveat:* Genet's ~16.5 kPa is **total** end-systolic myofiber stress (passive +
  active); the model's ~10–11 kPa is **active-only** — same order, a sanity benchmark, not a 1:1 match.

**The calibration rule this encodes:** fit Tmax0 to the **ceiling** (~120–135 kPa), and let the
activation fractions bring the **realised** stress down to the ~10–16 kPa in-vivo operating value.
Calibrating Tmax0 to the realised ~16 kPa would have been the error the inflated 382.5 kPa was a
crude over-correction for.

---

## B. Engine / numerical derivations  [codex1]

This section is the code-grounded counterpart to A: the exact arithmetic path used by
`engine/chambers.ts` and the places where that path is wired into the solver in `engine/ModelCore.ts`.

### B1. Where chamber math enters the solved state

The active-stress LV/RV model is not a standalone post-processor. It is rebuilt from the current
node `active` parameters whenever `nodeOverrides.*.active` changes, so edits to `sigmaPas0`,
`bPas`, `lambdaPas0`, `Tmax0`, `geomChi`, `Vref`, etc. are actually used by the pressure evaluator
(`ModelCore.ts` lines 354-361). Each timestep:

1. `computePressures()` reads the solved chamber volume state `x[node.LV/RV]` in mL and the internal
   Ca/activation states `cLV/aLV` or `cRV/aRV` (`ModelCore.ts` lines 849-855).
2. It calls `ActiveStressChamberModel.pressure(V, internal, chamberCtx)` and receives transmural
   pressure in mmHg (`ModelCore.ts` lines 855-857).
3. The absolute chamber pressure used by valves/flows is `P = Pperi + Ptm`, where `Pperi = Pth()`
   (`ModelCore.ts` lines 813-818 and 855-858). Heart chamber pressure is therefore transmural
   active/passive pressure plus the pericardial/thoracic pressure environment.
4. The ODE also advances `phi`, `c`, and `a`: `dphi/dt = HR/60`, then
   `internalDerivatives()` returns `cDot/aDot` for LV and RV (`ModelCore.ts` lines 800-808).

State clamps are part of the numerical contract: active/elastance heart chamber volumes are clamped
to **3-450 mL** in `sanitizeState()` (`ModelCore.ts` lines 1024-1038). That is why the MR/TR floor
checks report the margin above the **3 mL** lower bound.

### B2. Sphere geometry as implemented

The implementation is `sphereRadii(VeffMl, VwMl)` (`chambers.ts` lines 75-83):

```text
Vi = max(VeffMl, 1e-3) * 1e-6       [m^3]
Vw = max(VwMl,   1e-3) * 1e-6       [m^3]

ri = (3 Vi / 4π)^(1/3)              [m]
ro = (ri^3 + 3 Vw / 4π)^(1/3)       [m]
h  = max(ro - ri, 1e-5)             [m]
rm = 0.5 * (ri + ro)                [m]
```

`VeffMl` is already the cavity volume after the chamber's dead volume is removed. For active
chambers, `geometry(V)` computes (`chambers.ts` lines 156-160):

```text
VeffMl = max(V - V0, Vmin)           [mL]
{h, rm} = sphereRadii(VeffMl, Vw)
lambda = rm / max(rmRef, 1e-9)       [dimensionless]
```

The `1e-3 mL` floors in `sphereRadii()` only prevent singular radii. The active-chamber `Vmin` and
the solver's 3 mL state floor are the practically relevant low-volume guards.

### B3. Reference radius and the `Vref` coupling

The reference mid-wall radius is precomputed once in the active model constructor:

```text
rmRef = sphereRadii(max(Vref - V0, Vmin), Vw).rm
```

This is `rmRefFromParams()` and the constructor cache (`chambers.ts` lines 85-87 and 147-154). The
current stretch is:

```text
lambda(V) = rm(V - V0, Vw) / rmRef(Vref - V0, Vw)
```

So `Vref` is **not** just a reporting reference. At fixed solved volume `V`, raising `Vref` raises
`rmRef`, which lowers `lambda`. That feeds both passive stress and active stress:

```text
stretch = lambda - lambdaPas0
sigmaPas = sigmaPas0 * (exp(bPas * stretch) - 1)

f_iso = clamp((lambda - lambdaPas0 + 0.3) / 0.35, 0, 1)
sigmaAct ∝ f_iso
```

This is the code reason the family-2 experiment (`Vref = 180`) admitted a larger EDV but collapsed EF:
the larger reference radius lowered `lambda` at the operating beat, which lowered `f_iso`, which
lowered realised active stress during ejection. Holding `Vref` fixed at LV 120 / RV 135 preserves the
active length-tension operating point while `sigmaPas0`/`bPas` are retuned. One caveat: in the current
code `lambdaPas0` appears in both `sigmaPas` and `f_iso`, so it is not purely passive either; the
landing's LV `lambdaPas0` shift was evaluated as part of the coupled fit, while the large EF collapse
was specifically the `Vref` denominator effect.

### B4. Full pressure-evaluation chain

The active pressure path is `ActiveStressChamberModel.pressure()` (`chambers.ts` lines 163-178):

```text
a = clamp(internal.a, 0, 1)
lambda, h, rm = geometry(V)

stretch  = lambda - lambdaPas0
sigmaPas = sigmaPas0 * (expClamped(bPas * stretch) - 1)                  [Pa]
gOver    = 1 / (1 + expClamped(kOver * (lambda - lambdaFail)))           [dimensionless]
f_iso    = clamp((lambda - lambdaPas0 + 0.3) / 0.35, 0, 1)               [dimensionless]

sigmaAct = Tmax0 * tmaxScale * contractility * a * gOver * f_iso         [Pa]
sigma    = sigmaPas + sigmaAct                                           [Pa]

PtmPa    = geomScale * geomChi * (2h / max(rm, 1e-6)) * sigma            [Pa]
Ptm      = clamp(PtmPa / 133.322, -5, 260)                               [mmHg]
```

The structural fact that mattered for M12-lite is visible in the last two lines: `geomChi` multiplies
the **sum** `sigmaPas + sigmaAct`. Therefore:

- `Tmax0` controls the active-stress ceiling before activation/length-tension fractions.
- `sigmaPas0`, `bPas`, and `lambdaPas0` control the passive stress curve.
- `geomChi` scales the pressure contribution of **both** passive and active stress after they have
  been summed.

That coupling is the root of the diastolic-stiffening side effect. Moving LV `geomChi` from 0.36 to
1.359637 fixed the geometry/active-force attribution but also multiplied passive pressure by
`1.359637 / 0.36 = 3.7768` if `sigmaPas0` was left unchanged. `sigmaPas0` and `Tmax0` are independent
magnitude knobs, but `geomChi` is a shared geometric pressure gain.

The context values come from `chamberCtx()` (`ModelCore.ts` lines 882-893). LV/RV independent
contractility edits are normally expressed through `lvTmaxScale` / `rvTmaxScale`; the raw
`contractility` context field is global. Geometry scale has the same chamber split:
`lvGeomScale` / `rvGeomScale`.

### B5. Dimensional bookkeeping

The code keeps three unit systems at once, with explicit conversion only at the geometry and pressure
boundaries:

| Quantity | Code symbol | Stored / computed unit | Conversion |
|---|---|---:|---|
| Chamber state volume | `V`, `V0`, `Vref`, `Vw`, `Vmin` | mL | state and params stay in mL |
| Geometry volume | `Vi`, `Vw` inside `sphereRadii()` | m³ | `mL * 1e-6` (`ML_TO_M3`) |
| Radius / wall thickness | `ri`, `ro`, `h`, `rm`, `rmRef` | m | cube root of m³ |
| Stretch / geometry factor | `lambda`, `2h/rm`, `geomChi`, `geomScale` | dimensionless | ratios only |
| Stress | `sigmaPas0`, `Tmax0`, `sigmaPas`, `sigmaAct`, `sigma` | Pa | no mmHg conversion here |
| Pressure before return | `PtmPa` | Pa | geometry factor × stress |
| Pressure returned to solver | `Ptm` | mmHg | `PtmPa / 133.322` |

Because `2h/rm`, `lambda`, and `geomChi` are dimensionless, the hand calculations in cm and the code
calculations in m produce the same pressure. The only pressure-unit conversion is the final
`/ MMHG_TO_PA`; the only volume-unit conversion is `ML_TO_M3` in `sphereRadii()`.

### B6. Sweep arithmetic behind the landed passive set

The direct "undo the old geomChi mask" compensation is:

```text
sigmaPas0,new = sigmaPas0,old * geomChi,old / geomChi,new

LV simple compensation = 2000 * 0.36 / 1.359637 = 529.55 Pa
RV simple compensation = 2000 * 0.28 / 1.138505 = 491.88 Pa
```

The RV landing uses that compensation rounded to `sigmaPas0 = 492` with `bPas = 10`,
`lambdaPas0 = 0.85`, `Vref = 135`, and `V0 = 15`. That keeps the RV lower-pressure and more compliant,
which is directionally right for a thinner-walled right ventricle.

The LV landing did not use the simple compensation because the bPas-10 limb was too gentle in volume
overload. The code objective used the actual pressure chain above:

```text
P(V; sigmaPas0, bPas, lambdaPas0)
  = geomChi * (2h(V)/rm(V)) *
    sigmaPas0 * (exp(bPas * (lambda(V) - lambdaPas0)) - 1) / 133.322
```

with `V0 = 10`, `Vref = 120`, `Vw = 150`, `geomChi = 1.359637`, and Klotz-style targets around
EDV 100/120/140/150 mL. Holding `Vref` fixed avoids the active `f_iso` collapse described in B3.
The fitted LV passive values were:

```text
sigmaPas0 = 200.133 Pa
bPas      = 23.2
lambdaPas0 = 0.9025
```

Those values intentionally trade a lower passive scale for a steeper exponential limb: normal EDV
stays usable, while the high-volume limb rises steeply enough that MR/volume-overload cases do not
run to the 3 mL ventricular floor.

## References

1. Regen DM. "Calculation of left ventricular wall stress." *Circ Res* 1990;67:245–252. (thin-/thick-wall LV stress) https://www.ahajournals.org/doi/pdf/10.1161/01.RES.67.2.245
2. Arts T, Delhaas T, Bovendeerd P, et al. "Adaptation to mechanical load… the CircAdapt model." *Am J Physiol Heart Circ Physiol* 2005. (single-fibre thick-sphere chamber; Sf,act ≈ 120 kPa) https://journals.physiology.org/doi/abs/10.1152/ajpheart.00444.2004
3. Bovendeerd PHM et al. "Dependence of local LV wall mechanics on myocardial fiber orientation." *J Biomech* 1992. (peak fiber stress ~30–110 kPa) https://pubmed.ncbi.nlm.nih.gov/1400513/
4. Klotz S, Hay I, Dickstein ML, et al. "Single-beat estimation of the end-diastolic pressure–volume relationship." *Am J Physiol Heart Circ Physiol* 2006. (V0, V30, Bn ≈ 2.76) https://journals.physiology.org/doi/full/10.1152/ajpheart.01240.2005
5. Pinto JG, et al. "Passive and active tension in single cardiac myofibrils." (max active tension ~145 ± 35 kPa) https://ncbi.nlm.nih.gov/pmc/articles/PMC1225421
6. Genet M et al. "Distribution of normal human LV myofiber stress at end diastole and end systole." *J Appl Physiol* 2014. (ED 2.2 / ES 16.5 kPa) https://pmc.ncbi.nlm.nih.gov/articles/PMC4101610/
