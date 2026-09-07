# Independent baseline candidate and implementation review

Please give your own candid scientific and engineering opinion, without deference to the main agent, earlier reviewers, or your earlier proposal. Read-only review. This is a pre-release educational cardiovascular 0D model, not a clinical device. The maintainer prioritizes mathematical, physical and physiological credibility, useful disease-expression space, numerical robustness and modest complexity. A single human maintainer and AI agents develop it. Backward compatibility is unnecessary. HR is restricted to 60 or 70 for baseline fitting. No afterload stress test is requested. Permanent changes require endorsement by at least one of Claude Fable 5.1 max and Codex 6 Astra max; approval is not assumed. You can reject any or all proposed changes. Please state the scope of approval clearly.

Working directory: /Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo.
Artifact directory: artifacts/baseline-candidate-2026-09-06.
Your previous independent review is in claude-review.md; do not treat it as binding. Read source and any other artifacts you consider useful. Search primary sources if needed. Do not edit files or execute numerical jobs.

New experiments since your review:
- affinity-v1, affinity-amplitude-v1, affinity-rise-v1, affinity-volume-v1: joint intact-cell Ca affinity and length-slope calibration, rise shape and operating point.
- fine-v1: both rest+reserve passing affinity-volume candidates independently re-settled cold at 1 ms; all blocking resting checks remain passing.
- final-response-v1: actual Tref ±20% without endpoint re-fitting; also a baseline systemic-resistance refinement to 1.04 (not an afterload stress test).
- source-transfer-v1: original source bridge rates/Aeff restored, Tref120k, affinity .805/- .7728, Ca floor .11, peak .8 or1.0, source duration and rise .6 or1, no bridge exit.
- transfer-velocity-v1: source restored bridge rates, peak1.0, Tref160k, phi scale .4/.6 crossed with no-exit/exit60.
All result summaries are available; examine actual result.json files as needed. Source-transfer and velocity batches have joint timing/gradient failures, which you should independently interpret, not take as a dismissal of source-transfer mechanisms.

Candidate under final qualification is final-response-v1/vascular-center-R1.04.result.json. New selected-fine-v1 and selected-headroom-v1 will appear while you review. Please wait for neither; report what you can verify and any conditional requirements. Candidate: HR70, TBV5250, R1.04, passive scale1.04, no aortic-to-systemic inertance, Land stretch multiplier1, Ca floor .13, source duration scale1.1 and rise fraction .9, CaT50ref .6 and beta1 -1.2, Tref238816.546 Pa, systemic compliance scale .65. Remaining production rounded kinetics/exit unchanged, atria unchanged, all 3 ventricular walls share material. No smoothing, new state variables, valve-to-Ca feedback or altered acceptance thresholds in this turn.

Please independently assess:
1. Is any candidate defensible as a baseline adoption candidate (public model mint and Surface integration remain separate), and which? If not, identify specific unmet evidence and a bounded remedy.
2. Are the permanently added research inputs/domain changes defensible? Joint affinity calibration, continuous finite Ca rise fraction .3–1, Ca peak .4–1.2 research input, and intervention-only Tref ceiling320k for actual ±20% response about the fixed239k candidate. No claim that these intervals are human normal ranges. Baseline-fit Tref domain is unchanged; 320k is not an expanded normal acceptance criterion.
3. Shape, relaxation/timing, LV/RV and valves, preload reserve and true intervention response versus merely relabeling knobs. Explicitly distinguish event/volume-flow quantities from catheter and Doppler measurements, and engineering screens from validated normal reference intervals.
4. What remains uncertain, and what must happen before public model adoption? Do not demand arbitrary new gates as clinical facts; do not favor complexity for its own sake.

Key code: engine/myocardium/experiments/MainWireBaselineReferenceResearchV1.ts, tools/scientific/runMainWireBaselineReferenceDesignV1.ts, analysis/methods/mainWire/MainWireEjectionShapeDiagnosticsV1.ts, baseline validation/evidence registry. Own construction checkpoint export is research-only, not a public Standard70 checkpoint. Regression tests are being extended to verify exact next-cycle restoration and wrong-construction rejection.

Please provide an explicit approve/conditional/reject verdict for candidate designation and research implementation separately, with reasons and assumptions. Offer your own alternatives freely. Avoid calling a single-model fitted result independently validated human physiology.
