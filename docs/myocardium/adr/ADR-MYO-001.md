---
title: "ADR-MYO-001 — Full replacement of the myocardial contraction subsystem, Phase A"
status: "Proposed"
date: "2026-06-26"
repository: "g960059/0DSimDemo"
supersedes: "Legacy ActiveStressChamberModel semantics"
source_design_record: "../research/myocardial-contraction-rebuild-design-record.md"
---

# ADR-MYO-001 — Full replacement of the myocardial contraction subsystem, Phase A

## Context

現行 `ActiveStressChamberModel` は、任意単位Ca、静的Hill activation、二重のlength dependence、post-hoc force–velocity、passive law、thick-sphere、stress-to-pressure倍率、心房reservoir状態を同一クラスへ混在させている。パラメータは最終圧・流量に対して積として補償し、構造的な同定不能性と低前負荷event-surface依存を生む。

本ADRのscopeは心筋収縮サブシステム Phase Aであり、full ionic ECC、monodomain、TriSeg/MultiPatchの必須実装、regional electrophysiology、全循環monolithic化を含まない。

## Decision

1. 旧active-stressをpatchせず、runtime互換性なしで置換する。
2. rhythm/AV delay/pacingを `ActivationScheduler` が所有し、Ca transient生成から分離する。
3. early backendは `PrescribedCalciumTransientV1` とし、保存型Ca cyclingとは呼ばない。
4. Land 2017 intact-humanを最初のfalsifiable myofilament候補とする。
5. Land source active fiber stressとwall-level homogenized stressを別contract・別provenanceにする。
6. source stressはengineering fiber strainに共役なnominal/first-Piola scalarとして扱う案を推奨し、owner sign-offで固定する。
7. state layoutはhierarchical instance pathを持ち、wall/region/patch-readyにする。ただしMultiPatch runtimeは実装しない。
8. kinematicsはstrainと全generalized coordinateに対する `dE/dq` を返す。
9. wall stressはvirtual powerにより全coordinateのconjugate forceへ写像する。cavity pressureはvolume coordinateの一例である。
10. implicit residualではstrainとstrain rateを独立入力にせず、scheme-consistent rateを導出する。
11. stabilization stiffness、algorithmic tangent、frozen-state tangentを別fieldにする。
12. local monolithic referenceとactive-stiffness-stabilized production solverを保持する。
13. cell/tissue、prescribed shortening、low/normal/high-afterload minimal chamberのjoint feasibility後にowner GOを要求する。
14. Phase 3 spikeはfixed `thick-sphere-v2`を使う。production ventricular mechanicsはPhase 4前に別途選ぶ。
15. TriSegはcandidateであり自動的な必須backendではない。
16. SERCA/RyR/SR-load等のofficial mechanistic caseは保存型Ca backend実装前には禁止する。
17. Phase 6ではLand LV/RVとclean atrial elastance bridgeを使い、legacy atrial active-stressを混入させない。
18. legacy states、snapshots、raw patches、knob mappingsを明示的に拒否する。
19. official casesをmechanism- and claim-aware recipeで再authoringする。
20. 長いdesign recordからmodel spec、verification plan、roadmapをnormative subsetとして分離する。

## Consequences

- baseline calibration、snapshots、official case数値は無効になる。
- state/parameter schemaは破壊的に変更される。
- Landはproduction統合前に棄却され得る。
- generalized-force contractにより初期実装量は増えるが、septum/AV-plane/TriSeg追加時の二度目のAPI破壊を避けやすい。
- prescribed-Ca版のscientific claimは明示的に限定される。
- 保存型Ca、TriSeg、BCS、MultiPatch、regional activationは別ADRで昇格する。

## Required owner decisions

### Decision summary

| # | Decision | Recommended default | Decide by | Status |
|---:|---|---|---|---|
| 1 | Land parameter variant | intact-human-37°C source set | Phase 0/1 | PENDING OWNER |
| 2 | Land source stress convention | fiber nominal / first-Piola scalar | Phase 0 | PENDING OWNER |
| 3 | fiber strain coordinate | engineering strain | Phase 0 | PENDING OWNER |
| 4 | source→wall homogenization | explicit adapter、fixed/independently constrained | Phase 4 | PENDING OWNER |
| 5 | sarcomere reference/anchor | source `Ls0` fixed、anchor fixed/narrow prior | Phase 3/4 | PENDING OWNER |
| 6 | passive law | convex exponential energy family | Phase 4 | PENDING OWNER |
| 7 | time integrator | BE bring-up、SDIRK2 reference、production benchmark | Phase 5 | PENDING OWNER |
| 8 | stiffness/tangent semantics | stabilization/algorithmic/frozenの3分離 | Phase 0/1 | PENDING OWNER |
| 9 | ActivationEvent contract | event ID＋time since event＋cycle length | Phase 0 | PENDING OWNER |
| 10 | prescribed Ca target/HR | paired Land＋human target、cycle-length knots | Phase 2 | PENDING OWNER |
| 11 | production Ca claim boundary | SERCA/RyR/SR-loadは保存型Caまで禁止 | Phase 0 | PENDING OWNER |
| 12 | closed-loop targets | versioned fit/validation/holdout packs | Phase 0 | PENDING OWNER |
| 13 | atrial progression gate | ventricular gates後 | Phase 6/7 | PENDING OWNER |
| 14 | loaded morphology target | composite pack、same measurement code | Phase 0 | PENDING OWNER |
| 15 | early kill gate | joint feasibility後GO/REVISE/NO-GO | Phase 0/3 | PENDING OWNER |
| 16 | realtime budget | 10× realtime等の暫定値 | Phase 0/5 | PENDING OWNER |
| 17 | temperature | fixed 310.15 K | Phase 0 | PENDING OWNER |
| 18 | first release atria | Land ventricles＋documented atrial bridge案 | release | PENDING OWNER |
| 19 | production ventricular mechanics | thick-sphere / TriSeg-lite / TriSeg-compatible | before Phase 4 | PENDING OWNER |
| 20 | regional runtime scope | schema only、MultiPatch runtimeは別ADR | Phase 0 | PENDING OWNER |

## Acceptance

- owner decisions 1–3、9、11、14、15、17、20がPhase 0で記録される。
- Phase 3 GOなしにPhase 4へ進まない。
- accepted ADRとmodel specのstress/strain/generalized-force semanticsが一致する。
