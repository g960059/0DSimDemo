My recommendation is to freeze this construction as a dev preview, then make the next scientific milestone a small set of discriminating cases. More baseline fitting, pressure recovery, characteristic impedance, or replacement contraction kinetics should earn priority by resolving a demonstrated case failure.

I support eventual adoption as an explicitly synthetic reference construction after the relevant qualification work. I oppose presenting the current evidence as establishing a generally normal adult heart.

The candidate deserves to be retained. The independent 1 ms rest result is settled, its checkpoint restores exactly, and the separate pressure-rate audit reports differences of approximately 1–3.3% between 2 ms and 1 ms extrema. These establish useful numerical evidence within their stated scope. They do not establish physiological normality, complete trace coverage, or the preload endpoints’ numerical qualification. [Candidate evidence](/Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo/artifacts/baseline-candidate-2026-09-06/selected-evidence-final.json), [checkpoint qualification](/Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo/artifacts/baseline-candidate-2026-09-06/selected-checkpoint-qualification-v2.json), [pressure-rate audit](/Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo/artifacts/baseline-candidate-2026-09-06/selected-pressure-rate-quality-final.json).

Several physiological questions remain visible despite the empty blocking-failure list:

- At 1 ms, mPAP is 20.87 mmHg, PA pressure 30.37/14.10 mmHg, LVEDVi 83.22 mL/m², LVEF 55.12%, and maximum LV dP/dt 2766 mmHg/s.
- The same construction at HR60 fails the current RVEDVi corridor: 91.69 mL/m².
- Existing calibration policy identifies the operating point at HR60; the candidate is centered at HR70. The preview must not imply completion of that policy without an explicit policy-compatible assessment. [Stage policy](/Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo/analysis/policies/mainWire/MainWireBaselineCalibrationStagePolicyV1.ts:24).

The pulmonary mean especially merits reconciliation before a normal-reference claim. The ESC/ERS resting invasive definition uses mPAP >20 mmHg, with PAWP and PVR needed to interpret the mechanism. The candidate’s model-derived pressure-drop/flow ratio is approximately 1.69 WU if mean LA pressure is used as the downstream pressure. That calculation does not make LA pressure an actual wedge measurement, but it illustrates why checking only systolic and diastolic PAP is incomplete. I support adding mPAP and model PVR to the baseline assessment now; selecting permanent healthy bounds requires an explicit observation and population decision. [ESC/ERS definitions](https://publications.ersnet.org/content/erj/early/2022/08/25/1399300300879-2022).

I would not reject the candidate simply because its Tref is approximately 239 kPa or its calcium affinity differs from the published source. Nominal material scales, realized fiber stress, and chamber pressure are different quantities. Land et al. themselves changed parameters when moving between skinned cells, intact muscle, and whole-organ simulations. That supports the legitimacy of a declared transfer calibration; it does not validate this particular transfer or the added bridge-exit mechanism. The appropriate next evidence is behavior under independent load and rate protocols. [Land et al., 2017](https://pubmed.ncbi.nlm.nih.gov/28392437/).

The semilunar ablation makes further valve-loss tuning a secondary priority. Removing the retained linear loss changes mean AV gradient by about −0.46 mmHg and mean PV gradient by −1.39 mmHg, with small changes in cardiac index and ventricular pressure-rate extrema. Those are informative mechanism effects, but they supply no empirical reason to choose zero resistance as the production value. [Factorized ablation](/Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo/artifacts/semilunar-load-ablation-2026-09-06/study-summary.json).

For the registry, expressivity should mean that the model can reproduce distinguishable observations and responses across mechanisms. A list of many disease names or many settings of one parameter provides little evidence. Conversely, two mechanisms producing similar resting BP and CO is valuable if the registry shows which additional observation or perturbation separates them.

I would prioritize these families:

| Priority | Cases and contrast | Measurements that carry the argument |
|---|---|---|
| First | One explicit resting construction, with HR60 and HR70 assessed under declared roles | Ao/PA mean and extrema; LA/RA mean and ventricular end-diastolic pressures; LV/RV volumes and EF; forward, reverse, and net flow; event timing |
| First | Reduced/increased blood volume; later, a venous-tone contrast at unchanged TBV | Net CO, filling pressures, EDV, transmural pressure, venous volume redistribution; immediate versus settled response where claimed |
| First | Higher systemic resistance versus lower systemic arterial compliance | MAP, pulse pressure, pressure-flow phase, stroke work and hydraulic power; a matched-MAP or matched-effective-elastance contrast |
| First | Reduced LV active tension versus increased LV passive stiffness versus slower prescribed calcium decay | EF/ESV, LA mean, LVEDP and transmural EDP, filling and relaxation timing; response to a shared preload/rate challenge |
| First | Pulmonary vascular load increase versus reduced RV active tension; compare with left-sided filling-pressure elevation | mPAP, LA mean, model PVR, RAP, RVEF/RVEDV, septal configuration, LV filling and net CO |
| First, staged | AS at different flow states; AR and MR; then MS | Forward/reverse/net valve volumes, regurgitant fraction, gradients with pressure stations specified, effective jet readback, atrial pressure and chamber loading |
| Next | Pericardial constraint/effusion versus intrinsic chamber stiffness; static PEEP | External, intracavitary and transmural pressures separately; chamber filling, ventricular interaction and net CO |

Start with roughly a dozen named constructions and shared perturbation protocols. Introduce additional severity levels only when they demonstrate a new behavior or identify an admissible boundary.

There are several reasons for this ordering:

- Resistance and compliance are not interchangeable afterload descriptions. Segers et al. showed that similar effective arterial elastance can coexist with materially different work and peak power. This is a strong educational contrast that does not require a wave-propagation model. [Segers et al., 2002](https://pubmed.ncbi.nlm.nih.gov/11834502/).
- Filling impairment should be assessed through a response as well as a resting number. In an invasive study, Borlaug et al. identified patients whose abnormal filling-pressure response emerged during exercise despite normal resting hemodynamics. This supports challenge-based assessment; it does not justify calling an isolated HR or Tref change simulated exercise. [Borlaug et al., 2010](https://pubmed.ncbi.nlm.nih.gov/20543134/).
- RV loading and ventricular interaction directly exercise the rationale for retaining TriSeg mechanics. The original TriSeg study evaluated normal loading and pulmonary hypertension, including septal behavior. [Lumens et al., 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC2758607/).
- Valve cases require joint interpretation of area, flow, gradient and regurgitant volume. A configured EOA/EROA is an input, so matching its own label is not independent model evidence. [ASE/EACVI stenosis assessment](https://www.asecho.org/wp-content/uploads/2025/04/2017ValveStenosisGuideline.pdf), [ASE regurgitation assessment](https://www.asecho.org/wp-content/uploads/2017/04/2017VavularRegurgitationGuideline.pdf).

These should initially have mechanism labels such as “reduced LV active tension” or “increased pulmonary vascular load.” Calling them HFrEF, HFpEF, PAH, pulmonary embolism, or chronic MR requires the additional phenotype and scope evidence appropriate to that name.

Current controls also constrain what can honestly be claimed. Wall active and passive scales span only 0.75–1.33, while pulmonary resistance spans 0.45–0.8. Reachability of substantial disease phenotypes has not been demonstrated by those bounds. Moreover, `arterialStiffness` changes both systemic and pulmonary arterial compliance. A “systemic stiffness” case must isolate or explicitly declare that coupling. [Wall ranges](/Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1.ts:29), [hemodynamic ranges](/Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3.ts:35), [vascular implementation](/Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo/engine/core/circulationGraphKernelV1.ts:125).

I conditionally support expanding ranges to reach a prespecified case. Expand the relevant mechanism, verify its boundary and selected combinations, and document the supported domain. I oppose widening every scalar and treating the resulting Cartesian product as supported.

The proposed evidence requirement is useful if interpreted as **“every mandatory gate has a resolvable, relevant basis.”** A rule requiring one paper or dataset everywhere would be mistaken. A rule checking only for a nonempty citation array would be inadequate.

The smallest sound distinction is:

| Gate basis | Minimum relevant support |
|---|---|
| Mathematical or numerical contract | The invariant/specification or derivation, plus executable verification appropriate to the claim; numerical tolerances additionally need a numerical-error rationale |
| Engineered guard | The failure or mechanism being guarded against, a discriminating reproducer/regression, and the reason for the chosen cutoff and applicability |
| Empirical physiological target | A verified source locator or dataset, population/protocol, observation mapping, and a transparent derivation or qualified interpretation of the threshold |

For example, conservation of blood volume does not need a healthy-cohort paper. A periodicity tolerance is not validated merely by citing a physiology paper. A one-peak waveform guard needs its model-specific failure rationale; it cannot borrow a clinical Doppler diagram as support for its precise pressure-peak-count threshold.

A few additional rules are essential:

1. **Support must cover individual checks.** A RAP reference does not substantiate the Ao extrema in the same `systemic-pressure` group. Shared evidence objects are fine, but coverage must be explicit.
2. **Distinguish direct support, contextual support and a gap.** An unrelated or merely contextual paper must not turn an unsupported threshold into an evidence-qualified one. An existing cutoff may remain a transparently provisional construction choice when that role is justified.
3. **Missing evidence prevents the corresponding qualified claim.** It need not prevent an exploratory simulation. Missing or invalid required measurements must never pass. Predetermined non-applicability, such as E/A without an identifiable atrial filling event, is a separate state.
4. **The observation operator is part of the comparison.** Specify pressure station/reference, flow versus velocity, forward versus net flow, event versus cavity-extremum volume, averaging window, and derivative bandwidth. Approximate mappings need an explicit limitation or uncertainty allowance.
5. **Dependencies remain visible.** EF/EDV/ESV, CI/SVI/HR, and Tei/ICT/IRT/ET are linked. Multiple checks are permissible, but they must not masquerade as independent fitting information. Repeated publication of one cohort is also one evidence lineage.
6. **Applicability belongs to the protocol.** Period-one settlement is appropriate for the current resting sinus baseline; it is not a universal requirement for transient interventions or an externally driven irregular rhythm.
7. **A source citation is not substantive review.** Automation can check resolution, coverage, required fields and claim consistency. It cannot establish that the cited passage supports the numerical decision.

The current registry’s separation between selected construction and targets is worth preserving. Its selected output vector must not become the target simply because it is now convenient to reproduce. [Current registry boundary](/Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo/analysis/registry/MainWireFittingReferenceRegistryV1.ts:25).

For patient-demo data, one attributable, appropriately usable and deidentified record can support a fitting demonstration. Record which measurements were actually observed, their acquisition conditions and uncertainty, and which quantities were inferred or supplied as assumptions. Report residuals and alternative parameter solutions; do not convert unmeasured values into normal targets. A fit to the same observations used for adjustment demonstrates reconstruction, while withheld observations or interventions provide a different and stronger check. A synthetic record remains useful, but must remain identifiable as synthetic.

My positions on permanent changes are therefore:

- **Support:** typed gate provenance, individual-check coverage, explicit observation semantics, and descriptive mPAP/net-flow reporting.
- **Support:** retaining contour and dP/dt corridors as warnings where their numeric physiological limits lack adequate support, while preserving signal-validity and artifact checks.
- **Conditional support:** adopting the candidate under a new exact identity after construction, checkpoint and relevant envelope qualification, with compatible production Surface and its pinned methods inherited.
- **Conditional support:** evidence-led changes to baseline population/range policy, targeted parameter-domain expansion, and new observation operators needed by selected cases.
- **Oppose for now:** choosing R=0, pressure recovery, Zc, extra contraction states, or new kinetic tuning simply to improve the present baseline’s shape or gate margins.
- **Oppose:** declaring all physiology established because every gate has one source, or relabeling unsupported physiological expectations as engineering guards solely to satisfy the source requirement.

Keep the implementation small: a typed case registry and shared runner/resolver used by the Workbench, scientific checks and fitting. Exact numerical/checkpoint semantics remain with the model; derived case observations and assessments remain in analysis; the Surface controls exposure and pins the methods.

Explicit later work includes appropriately qualified rhythm, coronary and device cases. Chronic remodeling, spontaneous arrhythmia generation, reflex exercise responses, regional infarction, spatial wave reflection, valve-jet detail, and oxygen-debt or treatment-outcome prediction should not be inferred from the present mechanisms. For example, the current oxygen model explicitly lacks organ partition, extraction ceilings, oxygen debt and lactate state. [Oxygen assumptions](/Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo/engine/physiology/oxygenTransportV1.ts:202).

This was a read-only review of source and existing evidence. I did not run fits, modify files, or read Claude’s new review or the parent’s decision document.
