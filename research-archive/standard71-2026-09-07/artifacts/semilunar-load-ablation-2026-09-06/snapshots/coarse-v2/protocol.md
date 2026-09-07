# Bounded semilunar / pulmonary vascular contrasts, preregistered before execution

Reference: qualified candidate vascular-center-R1.04 (HR70, TBV5250), common
myocardium and all calcium parameters fixed. Source exact construction retained.
No new baseline selection, gate change, patient fitting or afterload stress test.

Stage A: AV/PV background resistance 2x2 {source, zero}; areas, opening kinetics,
vessels and all other parameters fixed. Zero is a causal ablation, not a healthy
prior. AV/PV means and peaks, ET, ICT/IRT/Tei, LV/RV phase and pressure-shape
diagnostics, SV/CI, chamber volumes/pressures, E/A and residuals all reported.

Stage B: source valve R retained; PA and PArt pressure-volume amplitude ×0.75
and ×1.5. Ao/SA/Art entire pressure-volume laws must remain exactly equal.
The initial coupled S/C representation reached periodic states but C×0.75
could not pass the nominal hemodynamic checkpoint bound (arterialStiffness
1.893 > 1.5). Retain that unresolved run; do not relax the public bound.
Represent the same physical contrast with an explicit research-only
pulmonaryArterialComplianceResearchScale in {0.75,1,1.5}, leaving both original
global stiffness and systemic amplitude inputs untouched. This makes the
entire systemic constitutive law bit-identical and retains correct ownership.
Venous laws, unstressed volumes, resistance and L are unchanged. These are
counterfactual mechanism comparisons, not claimed literature normal intervals.

Reuse the matching 2 ms qualified checkpoint by intentional continuation;
stop only after the existing three-consecutive-cycle periodic classifier.
Maximum 180 cycles. Run four local processes concurrently. Existing exact
metrics/observers, lean settling, full-invariant diagnostic replay.
Report nonconvergence rather than relaxing tolerances. All new research
checkpoints are enclosed by full-construction and dt SHA-256 affinity; the raw
lower-level checkpoint alone is NOT an admissible experimental restart.

No historical recovered-root profile activation: it jointly changes static
pressure stations, Zc, L, compliance and volume offsets. Static-recovery physics
and pulmonary evidence are independently reviewed before any separate proposal.

Follow-up is limited to: fine-grid qualification of an informative contrast;
one crossed comparison if R and compliance have materially separate effects;
or a justified recovery-only experiment after explicit station/geometry decision.
No fresh Ca/Land search or automatic public baseline adoption.
