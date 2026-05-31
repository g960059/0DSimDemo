# Waveform morphology reference — canonical physiology vs the model's structural capability

Author: **claude1** (claude-code) · `.lit.md` = the **literature/physiology** half.
codex1 owns the **measured** half in `waveform-morphology.codex.md` (cross-check once it lands).

For each diagnostic waveform feature: **(i)** the canonical morphology a clinician expects, with a
real citation, then **(ii)** whether THIS 0D model's *structure* can produce it — given that
ventricles are single-fibre **active-stress** chambers, atria are time-varying **elastance** lumps
(`chamberActivation`, LA/RA scaled 0.35 at a phase offset), valves are **opening-fraction** area
elements (no leaflet/annulus mechanics), and the pulmonary segments are lumped `venousPressure`
nodes (PCap/PVen/PVein).

### What the engine actually exposes (the observability constraint)

Per-tick `SimSample` (`ModelCore.sample()`): **AoP, PAP, LAP, RAP, LVP, RVP**; flows **QAo, QPA,
QMV, QTV**; volumes **VLV, VRV, VLA, VRA**; activation aLV/aRV. `SimObservables` adds Pth/Palv,
`Q_VC_RA`, `Q_PCap_PVen`, and venous pressures P_SV/P_VC/P_PVen/**P_PVein**. **Pulmonary-vein→LA
flow (`PVein_LA`) is NOT exposed anywhere** — only its pressure. This matters for waveform #6.

---

## 1. AoP dicrotic notch / incisura (aortic valve closure)

**(i) Canonical:** at end-ejection the aortic valve closes; in the **central aorta** this cuts a
sharp **incisura** into the pressure trace; peripherally it softens into the rounded **dicrotic
notch**, which is no longer a pure valve event but a composite of **reflected pressure waves**
[Deranged Physiology, *Normal arterial line waveforms*]. The notch marks end-systolic aortic
pressure and the onset of diastole [Wiggers].

**(ii) Model structure:** AoP is exposed. The ingredients for a central incisura *exist* — the
aortic node has compliance, the **AoV** has opening-fraction closing dynamics (`tauClose` ~30 ms)
**and inertance** (`AoV_L` = 0.002) — so in principle the brief closing back-flow against inertance
should cut a notch. **BUT codex1's measured pass finds the notch ABSENT even in Normal** (the AoP
decays as a smooth Windkessel relaxation). → **Reconciled verdict: structurally LATENT but not
realised.** As tuned, the lumped single-node aorta plus the small `AoV_L` produces a closure
transient too gentle to surface a visible incisura; there is no separate aortic-root compartment to
host the water-hammer. **Two distinct gaps, don't conflate them:** (a) the *reflected peripheral
dicrotic wave* is genuinely unreachable in a lumped 0D model (no transmission-line) and should NOT
be "fixed"; (b) the *central valve-closure incisura* IS in-scope and could be surfaced with a small
**aortic-root closure submodel** — e.g. a distinct aortic-root compliance chamber, a larger
closure-time inertance, or an explicit closure-transient term. Recommend (b) as a targeted M12 item
if the dicrotic notch is a teaching priority. **Honest correction to my first pass:** I initially
rated this "✅ YES for the incisura" on structural grounds; codex1's measurement shows it does not
actually appear, so the realised verdict is **⚠️ latent / needs a root submodel.**

## 2. LVP has NO dicrotic notch

**(i) Canonical:** the dicrotic notch lives on the **arterial (aortic)** trace, not the ventricular
one; LV pressure falls smoothly through isovolumic relaxation with no incisura, because the notch
*is* the aortic-side signature of valve closure [Deranged Physiology; Wiggers].

**(ii) Model structure:** LVP and AoP are **separate nodes**; the incisura is generated at the Ao
node by AoV closure, not inside the chamber pressure law. → **Correct by construction** — LVP is
notch-free. ✓

## 3. LAP & CVP (RAP) a / c / v waves + x / y descents

**(i) Canonical** [StatPearls, *Physiology, Jugular Venous Pulsation*; Clinical Methods Ch.19]:
- **a** = atrial systole (atrial contraction pressure peak).
- **c** = bulging of the closed AV valve into the atrium during ventricular isovolumic contraction.
- **v** = atrial filling against a still-closed AV valve in late systole.
- **x** = atrial relaxation descent (after a).
- **y** = AV-valve opening, atrium empties into ventricle.

**(ii) Model structure (LAP & RAP both exposed):**
| Feature | Mechanism available? | Verdict |
|---|---|---|
| **a** | atrial elastance activation pulse raises atrial P | ✅ producible (true a-wave from the elastance lump) |
| **c** | **no valve leaflet/annulus bulge** — valves are flow R/L/area only; at most a tiny closing-backflow blip | ⚠️ **weak / largely absent — M12 gap** |
| **v** | venous inflow into the atrium while AV valve shut + atrial compliance | ✅ producible |
| **x** | atrial elastance falls after the a-wave | ✅ producible |
| **y** | AV valve opens, atrial volume drops | ✅ producible |

→ **a, v, x, y: structurally YES.** The **c-wave is the gap** (codex1 measured it weak/merged —
consistent). **Direct answer to lead's question — can a time-varying-elastance atrium produce a
c-wave at all? No, not on its own.** The c-wave is *not* an atrial event: it is the closed AV valve
bulging into the atrium driven by **ventricular** isovolumic pressure. In this model the only
atrium↔ventricle coupling is **flow through the valve**; when the valve is shut, flow ≈ 0, so
ventricular pressure is **not transmitted** to atrial pressure, and the elastance atrium has nothing
to generate a c-wave from. Producing one would require added structure — **valve-plane (annulus)
motion**, or a small **closed-valve pressure-coupling term** that leaks a fraction of (P_ventricle −
P_atrium) into the atrial pressure during isovolumic contraction. (By contrast the **a-wave** is
genuine: the elastance activation pulse is a real atrial contraction pressure rise, not an artefact.)

## 4. LV PV loop — rounded top

**(i) Canonical:** the normal LV pressure–volume loop has a **rounded, convex** ejection top (not a
flat/triangular cap), reflecting the continuous interplay of activation, ejection and afterload
through systole [Burkhoff 2005, *Assessment of systolic/diastolic properties via PV analysis*].

**(ii) Model structure:** VLV and LVP are exposed → the loop is directly constructible. The
**active-stress** force law is length- and activation-dependent (`f_iso`, `gOver`, the Ca-driven
`a`), so ejection pressure varies smoothly with instantaneous volume — yielding a **rounded top**,
arguably *more* physiological than a pure time-varying-elastance chamber (which tends to a more
cornered loop). → **YES** — a structural strength of the active-stress choice. (lead's baseline doc
already lists a "closed, convex LV PV loop" as the expected Normal signature.)

## 5. MV inflow — E and A waves (E > A normal)

**(i) Canonical:** transmitral diastolic inflow is biphasic: **E** (early passive filling, driven by
LV relaxation/suction and the LA–LV gradient) then **A** (late filling from atrial contraction). In
normal younger adults **E > A** (E/A ~1–2); the pattern is the cornerstone of diastolic-function
grading [Nagueh 2016, ASE/EACVI diastolic recommendations].

**(ii) Model structure:** **QMV is exposed.** Early diastole gives **E** from the LA–LV gradient and
**active relaxation** (`relaxation`, `tauCa`); atrial systole gives **A** from the atrial elastance
pulse. → **YES, biphasic E/A producible.** The **E/A ratio is tunable** — E scales with lusitropy
(relaxation/tauCa), A with the atrial activation amplitude (the 0.35 LA scale). Worth checking
(codex1) that the default lands **E > A** rather than a pseudo-restrictive or impaired pattern.

## 6. Pulmonary venous flow — S / D / Ar

**(i) Canonical:** pulmonary-vein Doppler is tri-/quadriphasic: **S** (systolic forward flow, as the
LA relaxes and descends during ventricular systole), **D** (early-diastolic conduit flow, tracking
the mitral **E** wave through the open MV), and **Ar** (brief **atrial reversal** during atrial
contraction). Normal S ≥ D; Ar duration ≤ mitral-A duration [Smiseth 2003, JACC, *Pulmonary venous
flow by Doppler echocardiography revisited*].

**(ii) Model structure:** the segments exist (PVein → LA via the `PVein_LA` edge), and the elastance
atrium *could* drive an **Ar** reversal when atrial-systolic LAP exceeds PVein pressure, an **S** as
LAP falls in systole, and a **D** as the MV opens. **BUT the `PVein_LA` flow is NOT exposed** in
`SimSample` or `SimObservables` (only `P_PVein` pressure is). → **NOT currently observable — clear
M12 gap.** Action: surface a `Q_PVein_LA` flow observable, *then* verify S/D/Ar actually emerge
(in particular whether the lumped atrium produces a credible **Ar** reversal). Until then this
waveform cannot be assessed against literature.

---

## Summary

| # | Feature | Canonical source | Model can produce? | Exposed? |
|---|---|---|---|---|
| 1 | AoP incisura | Deranged Physiology / Wiggers | ⚠️ latent — measured ABSENT (needs aortic-root submodel); reflected dicrotic ✗ unreachable | AoP ✓ |
| 2 | LVP no notch | Deranged Physiology / Wiggers | ✅ by construction | LVP ✓ |
| 3a | a-wave | StatPearls JVP | ✅ | LAP/RAP ✓ |
| 3b | c-wave | StatPearls JVP | ⚠️ weak/absent (no valve bulge) | LAP/RAP ✓ |
| 3c | v-wave | StatPearls JVP | ✅ | LAP/RAP ✓ |
| 3d | x / y descents | StatPearls JVP | ✅ | LAP/RAP ✓ |
| 4 | PV-loop rounded top | Burkhoff 2005 | ✅ (active-stress strength) | VLV+LVP ✓ |
| 5 | MV E/A (E>A) | Nagueh 2016 | ✅ (ratio tunable) | QMV ✓ |
| 6 | Pulm-vein S/D/Ar | Smiseth 2003 | ⚠️ structurally partial | **✗ not exposed** |

## Open questions / for M12

1. **c-wave** needs AV-valve→atrium mechanical coupling the lumped model lacks — decide whether it is
   worth a small phenomenological term, or just document as a known absent feature.
2. **Pulmonary-vein flow not surfaced** — add a `Q_PVein_LA` observable; then confirm S/D/Ar (and
   especially the **Ar** atrial reversal) emerge from the elastance atrium.
3. **Reflected dicrotic wave** is unreachable in a single-node aorta — out of scope for 0D; the
   model gives the valve-closure **incisura** instead. Document the distinction so it is not "fixed."
4. **E/A default ratio** — verify (codex1) the Normal case lands E > A.

## References

1. Deranged Physiology — *Normal arterial line waveforms* (incisura = AoV closure; peripheral dicrotic notch = reflected waves). https://derangedphysiology.com/main/cicm-primary-exam/cardiovascular-system/Chapter-760/normal-arterial-line-waveforms
2. Wiggers diagram / cardiac cycle pressure events. UTMB Pediatric Education — Cardiac Cycle. https://www.utmb.edu/Pedi_Ed/CoreV2/cardiology/Cardiology3.html
3. StatPearls — *Physiology, Jugular Venous Pulsation* (a/c/v waves, x/y descents). https://www.ncbi.nlm.nih.gov/books/NBK534125/ ; Clinical Methods Ch.19 — *The Jugular Venous Pressure and Pulse Contour*. https://www.ncbi.nlm.nih.gov/books/NBK300/
4. Burkhoff D, Mirsky I, Suga H. "Assessment of systolic and diastolic ventricular properties via pressure-volume analysis." *Am J Physiol Heart Circ Physiol* 2005. https://journals.physiology.org/doi/full/10.1152/ajpheart.00138.2005
5. Nagueh SF et al. "Recommendations for the Evaluation of LV Diastolic Function by Echocardiography." *J Am Soc Echocardiogr* 2016 (mitral E/A). https://www.asecho.org/guideline/recommendations-evaluation-left-ventricular-diastolic-function-echocardiography/
6. Smiseth OA, Thompson CR, et al. "Pulmonary venous flow by Doppler echocardiography revisited." *J Am Coll Cardiol* 2003. https://www.jacc.org/doi/10.1016/S0735-1097(03)00126-8 (S/D/Ar components).
