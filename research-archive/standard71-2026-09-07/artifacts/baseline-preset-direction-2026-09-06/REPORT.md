# Baseline preview, independent direction review, and gate provenance

## Delivered preview

Local Workbench: http://127.0.0.1:4185/ja/experiments/new . Separate dev-only identity `circleheart.dev.baseline-candidate.2a29a466`; no public mint, baseline adoption, push, or deployment. The original Standard70 numerical artifact and selected launch baseline are unchanged.

The ignored `preview/` overlay builds the actual research construction into the existing typed-authority Workbench host, not a static plot or a display-only pressure correction. It starts from a research-owned settled checkpoint; `qualification.json` records reconstruction, exact checkpoint restore, source file/construction digests, and readback. At the prepared t=126 s boundary, 2 ms readback gives AoP 121.675/84.430 mmHg and CO 6.09868 L/min. Build with `node artifacts/baseline-preset-direction-2026-09-06/preview/build.mjs`; serve with `npm run dev -- --config artifacts/baseline-preset-direction-2026-09-06/preview/vite.config.mjs`.

Browser verification: live LVP/AoP/LAP waveforms, PV loop, ESPVR/EDPVR (at least 5 settled points), PVA-ready state, and adaptive Starling/Guyton family (8 settled points) displayed. Output panel showed AoP 122/84.4 (102), PAP 30.4/14.1 (20.9), mLAP 10.6, CVP/mRAP 3.82 mmHg, LVEDV/ESV 158/71 mL, EF 55.1%, SV 87.1 mL and CO 6.10 L/min. TBV 5250→5300→5250 mL accepted without runtime rejection. This small control smoke test is not qualification of the whole exposed range.

Final verification: 53 tests passed across fittingGateProvenanceV1, mainWireIntegratedModelBaselineValidationV1, registeredModelLaunchBaselineV1, mainWireBaselineGateRolesV1, and testSuiteManifest; `npm run typecheck` and `git diff --check` passed. After the TBV return, the browser again showed PVA ready / 8 settled Starling-extension points with the candidate output values restored. The delivered tab remains open on PV loop and Outputs.

Compatible production graph/output/analysis methods are inherited. Explicit compatibility exception: this preview fixes the common absolute ventricular Tref and Ca shape; unsupported legacy global/individual ventricular active-tension controls are not exposed. HR is restricted to 60/70. The separate dev Surface and information disclosure identify the candidate as unadopted. It is not an editable absolute-material fitting UI or a published/persistable case definition. The artifact URL includes its revision to prevent browser caching from pairing changed code with an old manifest.

## Evidence admission

Permanent analysis/registry change: each mandatory gate needs relevant, resolvable evidence of its declared basis. Empirical support requires source-level and passage-level verification, explicit covered check IDs, population/protocol, source observation/range, operator mismatch, and bound rationale. Numerical contracts/engineered guards instead cite their specification and discriminating regression, with cutoff rationale and an explicit nonclinical scope. A citation is not proof of physiological validity.

The registry retains all 41 resting check records and four fixed-control LV/RV low/high-volume reserve records. Six existing reference-warning corridors remain advisory and are not made mandatory through provenance admission. Thus 39 records participate in required-evidence admission. Existing retrospective group references are not automatically reclassified as direct threshold evidence. The audit currently leaves 24 mandatory empirical checks in draft. This means incomplete threshold qualification, not that all 24 measurements are physiologically abnormal or have no literature.

Baseline generation and the current stable-publication CLI reject this incomplete admission before their writes; research fitting, local preview, and current immutable launch artifacts remain usable. Unknown case IDs still fail closed. No preset is silently marked fitted or adopted. Read-only audit: `npx vite-node --script tools/registry/assertFittingReferenceEvidenceV1.ts` (exit 1 is intentional while draft).

Carlsson 2012 Methods and Results were checked again in full text. Source-level verification was upgraded, and CI/SVI coverage made explicit, but the comparison remains context-only: its cohort summaries are not by themselves verification of the retained construction endpoints. https://link.springer.com/article/10.1186/1532-429X-14-51

## Independent reviews and adjudication

Full unconstrained reviews are in `astra-review.md` (Codex 6 Astra, max) and `claude-review.md` (Claude Code, confirmed claude-fable-5-1, max). Neither was instructed to agree with the parent or confine itself to the parent's proposed valve changes.

Both support an explicitly unadopted preview and typed per-check provenance; neither considers passing the current rest gates proof of a generally normal adult heart. Astra favors freezing the candidate and moving toward discriminating cases. Fable favors bounded Zc and Ca-time-shape tests before mint, flags late systolic pressure peak and filling pressure, and opposes immediate mint.

Parent judgment: retain the candidate without another open-ended refit. Reconcile the HR70 anchor versus the policy's HR60 role, mPAP/filling-pressure interpretation, and fine-step preload endpoints before adoption. A bounded physical Zc/recovery contrast may help adjudicate the pressure station and waveform issue, but neither Zc nor revised kinetics is adopted here. No display-only Zc addition. A characteristic impedance must have a declared pressure port and total resistance accounting; it cannot be treated as a cosmetic term.

Do not turn Fable's estimates into new gates: the stated LVP peak-position normal range and human Ca time-to-peak comparison were not established by checked matching data. Also, the condition C dP/dt=Qin−Qout does not imply peak timing is independent of C in a coupled circulation: P and Qout themselves change. For the limiting alpha shape t exp(−t/τ), the derivative at t=0 is finite, not zero. These observations weaken the claimed causal certainty, not the usefulness of a bounded Zc/Ca hypothesis test. Several of Fable's proposed case values lie outside current admitted parameter ranges and HR restrictions; they are not executable preset defaults.

Implementation review in `claude-implementation-review.md` gave conditional support. Its two must-fixes were applied: out-of-group/duplicate coverage and unknown verification fail loudly, and metadata-only sources cannot support a passage-checked threshold. Specific semilunar, pulmonary-morphology, ventricular-morphology, settlement, and four-direction Standard70 reserve regressions were added. Astra's interim implementation review identified the warning re-promotion and broad test-locator issues; both were addressed. Its follow-up ended on a usage limit, so the final implementation decision relies on Fable's conditional support with the required fixes, not a claimed second final approval. No numerical model, range, or physiological cutoff change is adopted by this review.

## Next case registry: mechanisms first, disease names second

Start with a small first batch rather than a large disease catalog. Each draft entry should bind an observation protocol, evidence-backed target/guard roles, physical parameter owners and permitted ranges, and record fitting residuals plus withheld observations. Store target evidence separately from the selected construction. Reuse existing runner/cache/worker machinery. Cloud execution and a generalized clinical-data platform are not prerequisites.

| Family | First contrasts | What distinguishes the mechanisms |
| --- | --- | --- |
| Volume/venous return | Low/high TBV; later venous tone at fixed TBV | CO, RA/LA filling pressures, EDV, transmural pressure, two-sided reserve |
| Arterial pressure load | Higher systemic resistance vs lower systemic compliance | MAP versus pulse pressure, pressure-flow timing, work; isolate pulmonary compliance |
| LV dysfunction | Lower active tension vs higher passive stiffness; impaired relaxation only when separately representable | EF/ESV, filling pressure, pressure-rate/timing and load/rate responses; not automatically HFrEF/HFpEF |
| Valve lesions | AS at differing flow; MR and AR; then MS | Area, specified-station gradient, forward/reverse/net flow, atrial waveform and chamber loading |
| Right heart | Higher pulmonary vascular load vs reduced RV tension vs raised LA pressure | mPAP, model PVR, RAP, RV volume/EF, septal interaction and LV filling |
| External pressure (later) | Pericardial constraint/effusion, static PEEP | Intracavitary versus transmural pressure and ventricular interaction |

This is a design priority list, not a claim that those cases have already been fitted or validated. Roughly 6–10 contrasting constructions suffice initially, then add severity levels only where they exercise new behavior. Systemic `arterialStiffness` currently also changes pulmonary arterial compliance; use/declare physical owners rather than trusting clinical knob names. Expand only the domain needed by a prespecified case and test its boundaries; do not claim a widened Cartesian parameter product is qualified.

Resistance and compliance can produce similar effective arterial elastance but different work and power (Segers 2002, model study: https://pubmed.ncbi.nlm.nih.gov/11834502/). Right pressure load and septal interaction are a meaningful test of the retained TriSeg structure (Lumens 2009: https://pmc.ncbi.nlm.nih.gov/articles/PMC2758607/). These are motivation for contrasts, not preset-specific numerical thresholds.

Use disease labels only after phenotype-specific evidence supports them. Do not inherit all healthy gates into pathological cases (e.g. EF, gradient, E/A, or single-peak morphology). Missing/nonapplicable observations must stay missing/nonapplicable, never become zero or normal. CI/SVI/HR, EF/EDV/ESV and Tei/timing are dependent observations, not independent fitting targets. Chronic remodeling, reflex exercise, spatial wave reflection, regional infarction, and patient outcome prediction are not established by this candidate. Patient-demo observations should distinguish measured values, assumptions, uncertainty and alternative parameter solutions; fitting the input measurements is reconstruction, not independent validation.
