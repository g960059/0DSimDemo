# Current development lanes

Status: proposed coordination note
Scope: coordination only; no runtime/model claim

## Purpose

Track what each active team lane owns, what it may claim, what is blocked, and what the next experiment should be.

## Execution Policy

The review gate for myocardium work is intentionally heavy, so PRs must not
shrink into documentation, audit, or readiness-only slices by default. A phase
PR should be large enough to produce real progress: implement the experiment,
run it, record the measured evidence, add focused verifier/tests, and update
only the docs needed to state the evidence boundary. Preparing for a later
experiment is not enough when the experiment can reasonably be run in the same
PR. Measurement comes first; the gate exists to review results, not to defer
them.

Oracle GPT Pro/extended is not a per-PR review gate by default. Use it roughly
every 3-5 PRs for a broad, flat direction review in the ChatGPT
`循環動態シミュレーター` project, asking for the repo's current-state review and
future direction without over-constraining the prompt. Keep a hard cap of two
oracle interactions per PR/session if a PR-specific escalation is still needed.

## Owner Release Posture

Production is currently unpublished with zero users. Treat the rollout bar as
an internal staged-replacement bar, not a public clinical-product bar. If
measured developer-only Land behavior is better than legacy active-stress for
education-visible outputs and does not introduce hard health, solver, settling,
or morphology regressions, prefer moving toward production-shadow and default
candidate evidence quickly. Keep the claim boundary low: no clinical/scientific
validation, no final no-alternans, and no official morphology acceptance unless
their specific gates pass.

Current owner priorities:

- Land is intended to replace the current active model; do not let low-preload
  alternans edge-case research block education-visible improvement after measured
  preflight, morphology, and health evidence are available.
- Atria should not stop at a bridge. The target is a refined atrial model that
  can reproduce correct atrial figure-eight PV loops; use a bridge only as a
  provisional integration path when evidence or oracle direction supports it.
- Morphology fixes for PV-loop roughness, filling jaggedness, and square
  ejection are first-class model work. Use arterial/filling diagnostics and
  isolated benches; do not tune myocardium parameters to hide morphology
  problems.
- Do not gate LV Land user-0 default migration on atrial figure-eight completion
  or HR105/HR120 edge behavior. Keep atrial figure-eight work separate and
  education-visible, while LV default decisions stay tied to LV health,
  operating point, morphology blockers, and rollback/frozen-reference posture.
- Official cases are smoke and teaching-surface checks until the model closures
  stabilize. Do not spend phase capacity on per-case fine tuning before the
  discharge path, normal-floor operating point, and atrial loop decisions settle.
- Studio/Workbench mock work is owner-led; model lanes should focus on
  mathematical model and engine evidence.

## Lane table

| Lane | Current state | Current blocker | Next experiment | Must not claim |
|---|---|---|---|---|
| myocardium | Phase 5AJ records `user0-lv-land-default-flip-rfc-phase5aj-result-v1` and `phase5aj-user0-lv-land-default-flip-rfc.md`, pinning Phase 5U/5V/5X/5AH/5AI evidence by stable hash. It classifies the LV Land default-flip direction as `rfc-ready-owner-decision-needed`: GO would proceed to a separate user-0 staged default-flip implementation PR, DEFER would require an explicit passive/geometry calibration PR first, and NO-GO would keep LV Land developer-only. Legacy active-stress remains frozen as positive-control reference and rollback; the actual default flip still requires owner GO. | Runtime default flip implementation, legacy active-stress deletion, official case reauthoring, Workbench runtime wiring, state-schema migration, Level 3/4 acceptance, official morphology, structural alternans removal, final no-alternans, production/default arterial root/Zc/inertance adoption, direct Ao_SA adoption, AoV-boundary carrier adoption, boundary/root production adoption, reflection-coefficient claim, valve/load candidate timing acceptance, qDot clamp removal, accepted preload/venous/passive/geometry/source-calcium tuning, Tref fudge, Land parameter tuning, and source-stress scaling remain blocked; arterial load, valve/load, classifier/window, PVein_LA/filling-inertance, and atrial filling lanes remain separate | owner GO/DEFER/NO-GO on the Phase 5AJ RFC; if GO, start a fresh default-flip implementation PR with baseline smoke/readback and one-command legacy rollback | no final no-alternans acceptance, no official morphology pass, no clinical/scientific validation |
| morphology | Phase M1 records `morphology-blocker-bundle-phase-m1-result-v1`; Phase 5X-5Z localize the LV qDot morphology blocker to real AoV/root discharge engagement rather than a dominant short-window denominator artifact. Phase 5AA records an offline prescribed-pressure arterial root inertance bench, Phase 5AB carries the lower-inertance region into closed loop, Phase 5AC adds direct isolated-bench input impedance spectra, Phase 5AD tests selected off-by-default prototype routes, Phase 5AE carries the AoV-boundary signal into a separated experimental boundary/root inertance hook, Phase 5AF sources the total 2x AoV/root candidate as the only preferred/broad Zc-range candidate, Phase 5AG shows closed-loop qDot+timing signal in 18/28 measured-health-ok comparisons, Phase 5AH attributes the weaker Land qDot headline to output-preserved but below-threshold qDot reductions rather than solve/output failure, and Phase 5AI bounds the Land normal-floor LVEDP excess as passive-proxy/source-sensitivity diagnostic evidence rather than morphology acceptance. Filling comparator evidence remains 39/42 interpretable; the residual gap is `lv-failure-dobutamine` branch 1 RV beats 1-3 missing only `eaLikeInflowProxy`. | residual dobutamine RV E/A-like proxy gap; reflection coefficient remains unavailable/no-proxy; production/default physical boundary/root inertance adoption missing; valve/load timing acceptance missing; qDot clamp removal remains unsupported; RV filling morphology blockers; accepted passive/source tuning remains blocked | keep PVein_LA/filling inertance plus atrial A1/refined figure-eight filling separate from LV default migration; derive/emit residual dobutamine RV `eaLikeInflowProxy` | no root-cause acceptance, no fix acceptance, no official morphology pass |
| atrial bridge | Phase 5.5 atrial bridge shootout and Phase 5.5B localization record measured E0/A0/A1 candidate evidence; Phase 5.5C runtime baseline adds measured stock-runtime evidence without remeasuring every candidate. `atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1` shows stock active no-provider ModelCore settles at HR75/90 but caps at HR105, matching the measured experimental A0 HR105 cap and making the high-HR boundary `runtime-boundary-likely` rather than atrial-provider-specific. Global elastance mode is measured as a whole-heart reference only. A1 valve diode contamination and sampling-invariance blockers remain; A1 repeatability remains `not-supported` as a blocker. No bridge is recommended or selected, and a bridge is not the final atrial physiology target. LV Land default migration must not wait for atrial figure-eight completion. | owner selection remains pending and oracle selection review remains pending; HR105 runtime/settling boundary can be treated as edge evidence for LV default posture but must be bounded before production atrial bridge selection; normalized A1 valve-event contamination and sampling-invariance blockers remain; refined educational atrial figure-eight-loop model path is not yet started | compare refined A1/provisional figure-eight candidates at HR75/90 with normal, preload-low, and preload-high envelopes; require readable LA/RA loops, visible booster loop, bounded valve/sampling contamination, and no LV/RV breakage; keep HR105 as edge evidence | final atrial physiology, AF validation, atrial Land/RDQ validation, production atrial bridge wiring, LV default migration gating |
| arterial load | Phase 5Y records real AoV qDot raw/post clamp engagement, and Phase 5Z no longer supports short-window denominator amplification as dominant. Phase 5AA adds the offline prescribed-pressure AoV/root inertance bench; Phase 5AB carries the lower-inertance region into closed loop through the existing `AoV_L` effective root-boundary carrier; Phase 5AC computes direct isolated-bench input impedance spectra; Phase 5AD tests selected off-by-default prototype routes; Phase 5AE adds a separated experimental boundary/root inertance hook without topology, state-layout, default-param, or direct `Ao_SA.L` changes. Phase 5AF calibrates total 2x as the preferred sourced-Zc candidate. Phase 5AG reruns that candidate over the full synthetic matrix, and Phase 5AH attributes the split: stock has strong qDot+timing response, while Land remains output-preserved and solve-ok but mostly timing-only below the qDot threshold; HR120 stock is a pre-existing non-health-ok edge. | no production/default boundary/root inertance adoption; reflection coefficient remains unavailable/no-proxy; no valve/load timing acceptance; no fix acceptance evidence that physical inertance makes qDot clamps unnecessary in the live production Land closure; qDot clamp removal remains unsupported | keep boundary/root off by default while the LV migration path moves to normal-floor LVEDP attribution; if root/Zc adoption is revisited, require live closure acceptance evidence with qDot clamps, valve thresholds, valve loss terms, load/preload, Tref, source-stress scale, and Land parameters fixed | production/default Zc adoption, qDot clamp removal, valve-threshold tuning, official morphology pass |
| studio/product | AI-native physiology studio direction proposed; owner is leading Studio/Workbench mock work outside this lane | MVP scope can grow too large | owner-led Home + Cases + static/mock Workbench | model validation, scientific acceptance |

## Weekly sync questions

1. Did any lane produce a BLOCKER for another lane?
2. Did any PR strengthen a claim boundary without evidence?
3. Is the next step an experiment or another readiness document?
4. Are we using morphology evidence to tune myocardium parameters? If yes, stop.
5. Are we using myocardium progress to claim product/clinical validity? If yes, stop.

## Current top priorities

1. Get owner GO/DEFER/NO-GO on the Phase 5AJ user-0 staged LV Land default-flip
   RFC. The actual default flip still requires owner GO and a separate
   implementation PR with baseline smoke/readback and one-command legacy
   rollback.
2. Keep the Phase 5AH boundary/root attribution bounded: it explains the weaker
   Land qDot response and HR120 stock edge, but it does not unlock
   production/default root/Zc adoption, qDot clamp removal, valve/load timing
   acceptance, or official morphology.
3. If the owner requires a numerical correction before default, make it an
   explicit passive/geometry calibration PR. Do not hide the Phase 5AI LVEDP
   excess with preload, venous-tone, source-stress, Tref, qDot, valve, or
   official-case tuning.
4. Advance atrial figure-eight work in a separate lane at HR75/90 normal and
   preload envelopes. Treat HR105/120 as edge evidence, not as an LV Land
   default gate.
5. Keep provider-local SDIRK2 solver hardening narrow; Phase 5C-R did not unlock
   final no-alternans.
6. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
7. Keep official cases at smoke/teaching-surface level until closures stabilize.
8. Keep Studio/Workbench mock work owner-led and separate from scientific
   acceptance.
