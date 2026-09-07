## Verdict summary

The most consequential remaining issue is not the PV background resistance alone. It is that the semilunar loss law applies the full vena-contracta Bernoulli drop between the ventricle and a compliance node that is displayed as recovered arterial pressure, and it stacks that on top of a legacy linear R that was calibrated when the quadratic term was 12 to 32 times smaller. Reduced PV R is necessary but not sufficient. The late LV and RV pressure peaks look like a load-model signature, not a myocardial one.

Explicit positions on each proposed permanent change:

| Proposed change | Position |
| --- | --- |
| Retain the hashed semilunar R multiplier seam (AoV/PV, values 0 or 1, research runtime only) | Conditional support |
| Admit a PV multiplier of 0.3 | Oppose |
| Adopt the recovered-root port (pressure recovery + Zc) for AV or PV as public baseline | Oppose at this stage |
| Generalize the recovered-root port into a valve-agnostic research port with declared geometry, no Zc, separate from the stiffness multiplier | Conditional support as research only |
| Display-only Zc·Q correction to PAP or AoP | Oppose |
| Any public baseline mint or control-range change now | Oppose |

## Question 1: issues, comparisons, and how to tell causes apart

**Code finding, high confidence: the semilunar linear R is a double-count remnant.** The old topology valve law had a fixed quadratic coefficient B alongside R and L. The current law replaced B with the ideal Bernoulli loss at EOA but kept R unchanged. For the inlet valves the new B is comparable to the old one, so their R is not obviously redundant. For the semilunar valves the quadratic loss rose by an order of magnitude while R stayed.

| Valve | Legacy R (mmHg·s/mL) | Legacy B (mmHg·s²/mL²) | Current B at max EOA | Ratio |
| --- | ---: | ---: | ---: | ---: |
| AoV | 0.0015 | 1e-6 | 3.24e-5 | 32× |
| PV | 0.005 | 2e-6 | 2.48e-5 | 12× |
| MV | 0.0027 | 8e-6 | 1.31e-5 | 1.6× |
| TV | 0.0035 | 1e-5 | 6.2e-6 | 0.6× |

Source: `engine/core/topology.ts:194-197` versus `idealBernoulliLossFromEffectiveOrificeAreaV2`. This justifies a semilunar-only ablation scope and is prior evidence that R→0 is the physically defensible default for thin-leaflet valves, not merely a causal endpoint. It does not by itself justify changing the NORMAL body without the closed-loop ablation.

**Scientific finding, moderate to high confidence: the loss station matters more than R for the PV.** At peak PV flow the linear part is about 2.3 mmHg and the quadratic part about 5.5 mmHg. Removing R leaves 5.5 mmHg, which is the vena-contracta gradient. Reil's healthy controls show a Doppler peak gradient of 3.6 ± 1.0 mmHg, so the model's vena-contracta-equivalent gradient is roughly two standard deviations high, driven by peak velocity 1.17 m/s against about 0.95 m/s. But the model's PA node is not the vena contracta. For a normal PV with EOA/PA area ratio around 0.7 to 0.8, the Borda-Carnot recovery fraction 2r − r² is 0.9 or higher, so the net static RV-to-PA drop should be a fraction of a mmHg plus any kinetic-head convention. The model applies the full 5.5 mmHg as a static node drop. For the AV the ratio is about 0.5, so recovery is about 75% and the overstatement is smaller. This is a formula-based estimate. There is no catheter validation of pressure recovery in native adult pulmonary valves.

**Scientific finding, moderate confidence: the late pressure peaks are load-determined.** With Zc = 0 and L = 0 on both roots, each arterial node is a two-element Windkessel whose pressure peaks when valve inflow equals runoff, late in ejection. LV and RV pressure follow the node closely, so their peaks land at 76% and 69% of ejection and AoP at 83%. The existing amplitude-response artifact supports this: at Tref × 0.8 the LVP peak phase is 0.750 versus 0.762 at baseline, and AoP 0.824 versus 0.834. Contractility barely moves the peak phase. That is the signature of a load property. Richter's non-PH RV curves peak early. This attribution is untested in this model until a Zc factor is run.

**Minimum informative comparisons, in order.**

1. The 2×2 semilunar R ablation with the seam already in the tree. Record gradient decomposition, ET, SV, peak flow, LVP/RVP peak phase, Newton and line-search counts, and a 1 ms versus 2 ms check. Expected: PV mean gradient falls by about 1.6 mmHg, peak by about 2.3 mmHg before closed-loop feedback, and little else changes. If shape metrics move materially, that is itself a finding.
2. Loss-law station factor: vena-contracta loss versus energy-loss-coefficient net loss at a declared downstream area, no Zc, for AV and PV separately. This isolates recovery from wave loading.
3. Zc factor with DC-conserving repartition, systemic then pulmonary. This isolates the peak-phase question. Prediction to falsify: LVP peak phase moves below about 0.6 with myocardium fixed.

**How to distinguish causes.** Valve loss changes gradient at fixed flow and leaves ET and peak phase nearly unchanged. Vascular loading changes peak phase, pulse pressure, and the timing of the gradient without changing the flow-to-gradient slope. Myocardial causes change ET and peak-flow-to-mean-flow ratio. The model's RV ET of 271 ms against Gardin's 331 ms means peak flow, hence quadratic gradient, is elevated by timing as well. That cannot be separated under the fixed-myocardium constraint, so state it as a documented residual rather than fit it. One caution on the parent's use of Gardin: the pulsed-wave main-PA velocity of 0.63 m/s is a post-recovery station. The model's Q/EOA is a vena-contracta velocity and should be compared to CW valve velocity, which is about 0.9 to 1.0 m/s in controls.

## Question 2: the resistance seam

The seam already exists as `engine/valves/MainWireSemilunarResistanceResearchV1.ts` with a unit test. It is narrowly typed to AoV and PV with scales 0 or 1, hashed, validates the canonical source unchanged, and is refused when the selected aortic-outflow profile is active. Zero-R flow passes a valve-level test. That is sound as far as it goes.

Conditions for permanent retention:

- **Wire it into research provenance.** The research construction in `MainWireBaselineReferenceResearchV1.ts` does not accept the profile, and its identity hash does not include it. Without that, ablation artifacts carry a hash that no committed construction reproduces.
- **Assert absence in the public assembly.** The optional key lives on the shared runtime type used by Standard70. Add an assertion plus test that the public exact-model assembly never sets it.
- **Closed-loop numerical coverage at R = 0.** The pure quadratic law has an unbounded flow tangent near zero flow. The AoV already sits near that regime with R = 0.0015, so risk is low, but a settled run with Newton iteration, backtrack, and 1 ms versus 2 ms statistics is required before any R = 0 result is read.
- **Sunset rule.** If the ablation supports a change, change the NORMAL body under the two-reviewer rule and keep the seam only as an ablation. The multiplier must never become the mechanism by which the public default is set.
- **Keep the value set at 0 or 1.** A 0.3 is a fitting knob with no derivation, and the current test correctly rejects it. If a small viscous term is later wanted, derive it from geometry.

No simpler sound option exists. Changing the NORMAL body now would be an unsupported default change, and a branch-only override loses provenance. Diagnostics that read canonical valve params read only areas, so the ablation does not desynchronize readbacks.

## Questions 3 and 4: the recovered-root formula and stopping

**Mathematical consistency.** The port law is ΔP_node = (R_bg + Zc)Q + (B_ELCo + B_AA)Q|Q|, with opening driven by LV minus the port. The energy-loss coefficient reproduces the Borda-Carnot loss exactly, and the reported recovery equals ρ·v_AA·(v_vc − v_AA), which is the momentum-balance result. The pressure and power ledgers close, and the tangent tests match finite differences. It is internally consistent.

**Convention divergence, moderate confidence.** The port subtracts the ascending-aortic kinetic head ½ρ(Q/AA)² from the ventricular cavity pressure. That is correct if the upstream pressure is a stagnation pressure. The clinical energy-loss literature, including Reil's PRI = 2r − r², defines net gradient as the irreversible loss only, implicitly treating upstream and downstream kinetic heads as cancelling. The two conventions differ by about 1.9 mmHg at the AV and about 3 mmHg at the PV at peak flow. Small for the left side, not small relative to a normal RV-to-PA gradient. Whichever is chosen must be explicit and identical on both sides. Also, the kinetic power is labelled transport rather than dissipation, but the loop has no downstream kinetic state, so it is lost from the energy ledger. That is about 1 to 2% of stroke work.

**Storage node.** P_C = P_port − Zc·Q is the standard three-element Windkessel internal node and is not a location. Displaying the port as AoP is then the consistent choice, not a UI correction, because valve and root couple at the port. DC resistance is conserved only when systemicResistance is 1, since the residual is scaled and Zc is not. The error is about 0.1% of SVR and can be documented.

**Code finding that blocks factorized use.** The selected profile bundles Zc, a 0.4× ascending inertance, and a 2× systemic tangent stiffness multiplier, and its validator requires every field to equal the fixed profile. It cannot isolate pressure recovery from Zc or from stiffness. A factorized study needs a valve-agnostic port with a declared downstream area and Zc as a separate, optional factor.

**Transfer to native PV.** Not justified yet. Missing evidence: native adult PV effective area by continuity, the recovery station and its diameter for a native valve, and any invasive validation. Reil measures 2 cm distal to the homograft, uses CT and echo diameters, and states that invasive data are absent. Pulmonary Zc is about 20 dyn·s/cm⁵, or 0.015 mmHg·s/mL, but the PA_PArt edge carries only 0.00625 after scaling, so a DC-conserving carve-out is impossible without repartitioning pulmonary resistance. That is a topology decision, not a valve one. Available geometry: healthy main PA diameter about 24 to 27 mm by CT, echo upper limit 26 mm.

**Stopping condition.** Pre-register the three factors above with fixed comparison metrics and falsifiable predictions, and cap the work at those rounds. Stop when each known non-physiological finding has either an ablation-established cause or an explicit limitation note, no factor improves a declared shape or gradient metric while regressing a gate or dt-convergence, and both semilunar sides use the same loss and station convention. Anything beyond that requires a new written hypothesis. Public adoption is separate: it requires a new exact-model identity inheriting the current Surface, the two-reviewer support, and consistent treatment of both sides. Do not ship a recovered AV with a raw PV.

**Limitations of this review.** I ran nothing and inspected one replayed cycle plus the compact evidence. The recovery magnitudes for a normal PV are formula-based, not measured. The load attribution of peak timing rests on one contractility contrast and needs the Zc factor to confirm. I could not access the full Reil text directly and relied on the PMC extraction.

Sources:
- [Reil et al. 2022, Physiological Reports (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9746035/)
- [Gardin et al. 1984, Am Heart J](https://pubmed.ncbi.nlm.nih.gov/6695664/)
- [Murgo & Westerhof 1984, pulmonary input impedance](https://pubmed.ncbi.nlm.nih.gov/6733863/)
- [Richter et al. 2021, RV PV-loop shape in PH](https://journals.physiology.org/doi/full/10.1152/ajplung.00583.2020)
- [Framingham CT pulmonary artery reference dimensions](https://pubmed.ncbi.nlm.nih.gov/22178898/)
- [Main pulmonary artery echo reference values](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4272795/)
- [Pulmonary artery diameters by MDCT in healthy adults](https://pubmed.ncbi.nlm.nih.gov/17963079/)
- [ASE right heart assessment guideline](https://www.asecho.org/wp-content/uploads/2013/05/Echo-Assessment-of-Right-Heart-in-Adults.pdf)