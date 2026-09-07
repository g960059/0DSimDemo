# Population-weighted distortion hypothesis — prospective component comparison

Scope: research only. Public Standard70, baseline, gates, Model Surface, analysis
pins and checkpoint semantics remain unchanged. No afterload stress test.

Compare six-state source Land with a separate six-state moment hypothesis using
the SAME source population, Ca and length parameters; repeat with the selected
slow rates after removing its non-source extra exit. No amplitude fitting or
new rate grid. Zero excess distortion on incoming bridges (including W->S),
pool-mean distortion on departures, detachment evaluated at the mean. phi/cw/cs
are absent in the hypothesis, not secretly refitted. Moment states must never
be interpreted as Land mean-distortion checkpoints.

Include Land with phi=1 for each population-rate group as a factorial control:
this separates removal of the empirical phi multiplier from replacing the
steady population ratio by the instantaneous incoming flux. This is a model
form control, not another physiological fit or claim of source parameters.

Component tests before any coupled integration:

1. Population conservation/positivity; empty populations cannot store moments.
2. Same fixed-length equilibrium and zero-distortion isometric twitch as Land.
3. No-inflow, fixed-length survival: no spontaneous recovery of surviving
   bridges' mean distortion. Force decays with survival for positive force.
4. Frozen populations/rates, constant length factor: mechanical work equals
   the change of the bridge spring energy under prescribed length change.
   This does NOT prove full chemical thermodynamic consistency: ATP, distortion
   variance and the W->S stroke energy are not represented.
5. Finite velocity shortening, hold at the new length, with Ca held and removed;
   isometric twitches at representative lengths; previously recorded LVFW
   length/Ca replay. Use 2/1/0.5ms and refine further if conclusions change.
6. Do not translate component tails to ICT/IRT/ET or predict a new PV loop from
   old prescribed kinematics. No selection based on a prettier trace alone.

Numerics: first-order linearly implicit flux step, previous-state detachment
rates, BE Ca/populations/moment losses. It is not a fully implicit nonlinear
BE solve. No smoothers, force clipping, state resets or population projection.
Comparison runs retain hashes and source snapshots and refuse overwrites.

Progression rule: only consider closed-loop integration if component behavior
and numerical refinement support it without an obvious new constitutive defect.
Preserve failed outcomes and state explicitly if the candidate is rejected.

Primary context: Land 2017 Eqs 27-28 explain constant recovery rates through
steady population ratios. Our transient moment closure is not their validated
parameter set/model. Regazzoni et al. 2020 use population/distortion moments
under specific rate assumptions; our mean-dependent detachment does not meet
their exact PDE-to-ODE closure condition and is NOT an RDQ20 implementation.

- https://doi.org/10.1016/j.yjmcc.2017.03.008
- https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1008294
