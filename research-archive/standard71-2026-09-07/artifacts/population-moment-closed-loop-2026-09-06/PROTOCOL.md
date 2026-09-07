# First closed-loop source-rate population-moment contrast

Registered before execution of `contrast-v1`.

Question: does the component-level source-phi population-moment hypothesis
improve coupled ejection/relaxation without exchanging normal output for a
distorted pressure waveform? This is an equation-form comparison, not fitting.

Four independent cold starts: source-rate Land versus source-phi moments,
each at 2 ms and 1 ms. HR70, BSA1.9 in the inherited observer, TBV5200 mL,
systemic resistance1.10, arterial PV amplitude0.6, passive/SLS scale1.248,
Ao-SA inertance0, Land stretch multiplier1.06, Ca time scale1.1 with fitted
floor/peak retained. Source Tref120 kPa, kuw182/s, kws12/s, Aeff25, phi2.23,
beta1 source, no added strong-bridge exit. Other inherited inputs identical.
The arterial PV amplitude changes storage and compliance together; it is not
an isolated compliance contrast. Only the Ao-SA inertance is removed.

Hypothesis has six states C,B,W,S,Mw,Ms (same dimension, different meaning),
zero-distortion incoming bridges, mean-based detachment and an explicitly
phenomenological phi-scaled turnover relaxation. It is NOT an exact
strain-distribution/PDE reduction, chemical-energy/ATP model or fitted human
normal relation. No force clip, pressure clip, phase/valve feedback or new
opening-state/inertance change. Ventricular/septal law changes together;
atria, TriSeg anatomy, SLS/passive, vascular equations and Ca are matched.

Prerequisites: finite-difference verification of analytic material tangent;
owned-state pure trials; exact wall/whole-model checkpoint roundtrip;
next-cycle deterministic replay; parameter/closure mismatch rejection.

Settlement: retain full circulation/coronary/rhythm/geometry/SLS/calcium
closure checks. The research-only comparator privately projects moments to
population/mean observables for the inherited checker AND separately checks
actual Mw/Ms at predeclared unit scales. This diagnostic view is never
advanced, saved or restored. Three consecutive period1 closures at inherited
tolerance; period2 suspicion tracked separately; max250 cycles. No public
model qualification claim. Hot-path-lean, four local workers.

Use exact accepted-beat pressures/flows/dPdt, inherited timing/inlet observer
with real lookahead when needed, and unsmoothed accepted-endpoint waveform
diagnostics. AV mean/peak gradient here is forward-flow LV-Ao node difference,
NOT a Doppler or pressure-recovered catheter gradient. ET/ICT/IRT/Tei refer
to organ events, not component RT50/RT95. Shape scores are descriptive, not
new normal thresholds. Retain failure and nonsettlement instead of clamping.

No baseline adoption, gate edits, Surface changes, modelID mint, preload
reserve or afterload stress test in this contrast. If matched-source timing
does not improve, do not start compensatory parameter grids: inspect the
material/Ca/pressure trajectories and reconsider the equation hypothesis.
