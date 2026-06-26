---
title: "0DSimDemo 心筋収縮サブシステム全面刷新 — Phase A Land-first実装・検証計画"
status: "Revision 3 proposed / implementation handoff + normative companion docs"
revision: 3
target_repository: "g960059/0DSimDemo"
baseline_commit: "228bef96e5f522de2cfe352de5d6d4d2f017c550"
baseline_date: "2026-06-14"
document_date: "2026-06-26"
revision_date: "2026-06-26"
suggested_repository_path: "docs/myocardium/research/myocardial-contraction-rebuild-design-record.md"
scope: "Myocardial contraction subsystem Phase A; not a full cardiac electrophysiology or whole-heart mechanics replacement"
primary_decision: "Land-first falsifiable kernel; geometry-agnostic generalized mechanics; no runtime backward compatibility"
decision_status: "Recommended defaults pending owner sign-off"
primary_falsification_question: "Does an admissible activation + prescribed-Ca + Land parameterization satisfy cell/tissue protocols and a family of loaded protocols without clamp, output-suppression, or hidden-gain artifacts?"
normative_documents:
  - "docs/myocardium/adr/ADR-MYO-001.md"
  - "docs/myocardium/model-spec/myocardium-land-v1.md"
  - "docs/myocardium/verification/myocardium-v1-verification.md"
  - "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"
---

# 0DSimDemo 心筋収縮サブシステム全面刷新 — Phase A Land-first実装・検証計画

## 0. 文書の位置づけ

本書は、現行の `ActiveStressChamberModel` を段階的に修理する計画ではない。心筋収縮、activation timing、Ca入力、myofilament kinetics、組織へのhomogenization、心室運動学、generalized forceへの写像、およびその数値結合を、**旧パラメータ意味論を引き継がずに新規実装するための設計記録兼実装チーム向け総合仕様**である。

Revision 3では、外部レビューとモデルチーム議論を反映し、Revision 2へ次の修正を加えた。

- rhythm/pacingからCa transientまでを一つの入力契約にせず、`ActivationScheduler` を独立レイヤにした。
- 二状態Caモデルを `PrescribedCalciumTransientV1` と改称し、保存型Ca cyclingでないことを明示した。
- Land source outputとwall-level stressの間へ、明示的な `MyocardiumHomogenizationAdapter` を置いた。
- scalar pressure-only mapperを廃止し、複数のgeneralized coordinateへ共役力を返すvirtual-power mapperへ拡張した。cavity pressureはvolume coordinateに対応する一成分である。
- implicit myofilament APIで、strainとstrain rateを独立に渡さず、previous/stage strainとintegration stageから離散rateを一意に生成する契約へ変更した。
- state layoutを「一心腔一unit」に固定せず、wall/region/patchを将来追加できるhierarchical instance pathへ変更した。ただしMultiPatch runtimeは初期スコープ外である。
- BCSをLand向けinterfaceへ先回りで押し込まず、Phase 9で専用activation adapterを設計してから追加する方針へ変更した。
- thick-sphereはearly spikeで使用する一方、production ventricular mechanicsはPhase 4前に `thick-sphere-v2 / TriSeg-lite / TriSeg-compatible` からownerが選ぶdecision gateとした。TriSegを自動的な必須要件にはしない。
- prescribed Caで主張できる機序を制限し、SERCA、RyR、SR load、Ca alternans等をofficial caseで扱う前には保存型Ca modelを必須とした。
- Referencesを正式書誌へ更新し、特定できない曖昧な引用をnormative sourceから外す規律を追加した。
- 長大な本書をdesign recordとして残し、ADR、model spec、verification plan、roadmapを別のnormative companion documentとして生成する構成へ変更した。

本刷新のscopeは、**心筋収縮サブシステムと、その心腔力学への明示的接続**である。full ionic ECC、monodomain、regional electrophysiology、MultiPatch disease runtime、TriSeg実装そのものを一括して必須化する「全心臓モデル再構築」ではない。ただし、今回作るAPIとstate schemaは、それらを別ADRで追加できるようにする。

本書と同時に、以下の規範文書を管理する。

```text
docs/myocardium/adr/ADR-MYO-001.md
    scope、採否、owner decisions、non-goals

docs/myocardium/model-spec/myocardium-land-v1.md
    方程式、単位、状態、API、stress/strain、discrete solver contract

docs/myocardium/verification/myocardium-v1-verification.md
    target packs、protocol、joint feasibility、GO/REVISE/NO-GO

docs/myocardium/roadmap/myocardium-rebuild-roadmap.md
    Phase、PR、file map、migration、Definition of Done

docs/myocardium/research/myocardial-contraction-rebuild-design-record.md
    本書。背景、比較、判断理由、詳細議論を保存
```

矛盾時の優先順位は、`accepted ADR > model spec > verification plan > roadmap > design record` とする。

本書中の規範語は次の意味で使用する。

- **MUST**: マージまたはリリースに必須。
- **MUST NOT**: 禁止。
- **SHOULD**: 原則として実施し、外す場合はADRに理由を残す。
- **MAY**: 任意。

Decision statusは次のように扱う。

- **RECOMMENDED / PENDING OWNER SIGN-OFF**: 本書が推奨するdefault。不可逆な接続PRの前にowner承認が必要。
- **ACCEPTED**: ownerがADRまたはdecision logで承認済み。
- **REJECTED / REVISE**: 別案または追加検証が必要。

この刷新の成功条件は「モデルが詳細になったこと」でも「period-2が消えたこと」でもない。次の10点を満たすことである。

1. activation、prescribed Ca、myofilament、homogenization、kinematics、passive material、generalized-force mappingの責務が分離される。
2. 細胞・組織・臓器のパラメータが同じ倍率に潰れず、階層的に同定できる。
3. source active stress、wall active stress、stabilization coefficient、algorithmic tangentが意味を分けて得られる。
4. cavity pressure、septal force、AV-plane force等を同じvirtual-power原理から導ける。
5. 低前負荷、通常負荷、頻脈、病態ケースで数値的・生理学的な反証可能性を持つ。
6. 旧モデル由来のリミッタ、人工遅延状態、自由倍率を新モデルへ持ち込まない。
7. 正常負荷下のLVP/RVP morphologyが事前登録targetへ入り、現行artifactの過度に狭いLVP FWHM（代表値約92 ms）を解消する。92 msは症状baselineであり目標値ではない。
8. morphology改善は、peak pressure、stroke volume、ejection durationを潰すこと、qDot/flow clampを増やすこと、またはwaveformを平坦化することによって達成しない。
9. production solverが教育用インタラクティブ実行の性能予算を満たす。
10. prescribed Caを使用する版では、その機序的限界がUI、case metadata、result provenanceへ明示される。

本計画の中心的な反証質問は次である。

> **Landのcell/tissue protocolを保つ一つの許容activation＋Ca＋Land parameterizationが、規定短縮と複数loaded protocolを経て、生理的な負荷下LVP morphologyを再現できるfeasible regionを持つか。**

この質問にearly spikeで否定的な答えが出た場合、Phase 4以降へ惰性的に進まない。Land variant、Ca target、homogenization、kinematics、morphology target、afterload family、または代替backendをowner判断で見直す。

## 目次

- [1. Executive decision](#1-executive-decision)
- [2. 現行実装の診断](#2-現行実装の診断)
- [3. Goals / Non-goals](#3-goals--non-goals)
- [4. 科学的モデル選定](#4-科学的モデル選定)
- [5. 新アーキテクチャ](#5-新アーキテクチャ)
- [6–15. 単位・API・Land・Ca・幾何・一般化力・solver・parameter](#6-単位規約)
- [16–18. 校正・検証・早期反証・受入基準](#16-校正戦略)
- [19–21. Phase/PR・ファイル変更・scripts](#19-実装phaseとpr分割)
- [22–25. Data・risk・limitations・Definition of Done](#22-data-and-fixture-governance)
- [26. Open decisionsと推奨default](#26-open-decisions-requiring-model-team-sign-off)
- [27. ADR draft](#27-adr-myo-001-draft)
- [28. References](#28-references)
- [Appendices](#appendix-a--initial-implementation-checklist)

# 1. Executive decision

## 1.1 採用する方針

第一世代の候補stackは次の構成とする。

```text
Rhythm / pacing / chamber timing
        ↓
ActivationScheduler
        ↓
PrescribedCalciumTransientV1
        ↓
Land 2017 source myofilament kinetics
        ↓
MyocardiumHomogenizationAdapter
        ↓
Myocardial unit / wall kinematics
        ↓
Passive material + viscosity
        ↓
Generalized virtual-power mapper
        ↓
Locally implicit / active-stiffness-stabilized coupling
        ↓
Existing closed-loop circulation and valves
```

モデルの役割は次のように固定する。

| 役割 | モデル | 初期実装での扱い |
|---|---|---|
| activation timing | `ActivationSchedulerV1` | MUST。full electrophysiologyではない |
| Land反証用Ca | `PrescribedCalciumTransientV1` | MUST。保存型Ca cyclingとは呼ばない |
| 標準myofilament候補 | Land 2017, intact-human, 37°C | MUST、early falsification gateを通過すること |
| source→wall変換 | versioned homogenization adapter | MUST。隠れた自由倍率を禁止 |
| early geometry | thick-sphere minimal harness | MUST、使い捨てde-risking用 |
| production ventricular mechanics | owner-selected backend | Phase 4前decision。TriSegを自動必須にしない |
| generalized-force mapping | multi-coordinate virtual-power map | MUST |
| 数値対照 | 局所monolithic reference | MUST |
| Phase 6心房bridge | clean time-varying elastance | 開発・検証専用MUST |
| 保存型Ca cycling | future gated backend | SERCA/RyR/SR-load等をofficial case化する前にMUST |
| BCS | independent later backend | Phase 9。Land型Ca interfaceへ先回りで入れない |
| RDQ20 / CMC | high-fidelity/offline reference | 初期スコープ外 |
| TriSeg / MultiPatch | mechanics extension candidates | 別decision/ADR。初期runtime必須ではない |
| full ionic ECC / ToR-ORd | 初期スコープ外 | 実装しない |
| monodomain / bidomain | スコープ外 | 実装しない |

Landは「採用済みの正解」ではなく、**最初に反証する本命仮説**である。cell/tissue fidelityと複数loaded protocolの双方を満たせない場合、詳細な統合へ進む前に見直す。

## 1.2 Scope boundary

本プロジェクトで必ず刷新するもの:

- activation event contract
- prescribed dimensional Ca transient
- Land myofilament kinetics
- source stressとwall stressの境界
- patch-ready dynamic state layout
- strain/stress measure
- passive energy / viscous dissipation
- generalized coordinate / generalized force mapping
- stable local coupling
- target/provenance/verification

Phase 4 decisionまで固定しないもの:

- production ventricular geometry family
- full septal mechanics representation
- first releaseでprescribed Caを許す範囲
- conservative Ca backendの導入時期

別project/ADRとするもの:

- full ionic ECC
- regional electrical propagation
- MultiPatch disease runtime
- CRT/LBBBのmechanistic activation field
- full-heart monolithic solve

## 1.3 後方互換性

ランタイム後方互換性は持たない。

- 旧 `heartModel: "activeStress"` は削除する。
- 旧snapshotは新エンジンでロードしない。
- 旧caseのraw parameter patchは自動変換しない。
- 旧knob mappingは新モデルで解決しない。
- 旧状態 `{c,a,r,tensionPa,lambdaAct}` は廃止する。
- 旧実装はgit tagまたはrelease branchでのみ保存する。

推奨tag:

```text
legacy-active-stress-2026-06
```

旧caseを新モデルへ移すときは、数値を移植するのではなく「症例の生理学的意図」を読み、機序ベースの新recipeとして再authoringする。

## 1.4 実装順の原則

重い基盤を完成してから中心仮説を確認してはならない。

```text
source-accurate Land
→ activation scheduler
→ prescribed dimensional Ca
→ isometric twitch
→ prescribed-shortening replay
→ multiple minimal loaded protocols
→ owner GO / REVISE / NO-GO
→ production mechanics backend decision
→ passive/generalized-force/solver integration
```

early spikeはproduction shortcutではない。自由な `geomScale`、homogenization gain、viscosity、afterload tuning、output suppressionで成功を作ることを禁止する。

## 1.5 Owner sign-off

§26の推奨defaultは、本書の整合したbaselineとして記載するが、ownerが判断する。特に以下はPhase 0で紙上確定する。

1. Land source stressの解釈とwall stress adapterの境界。
2. 0D fiber strain coordinate。
3. source parameter variantと派生parameter setの命名規則。
4. activation eventのsingle source of truth。
5. early morphology/loaded protocol target packの測定定義。
6. Phase 4前にproduction mechanics backendを選ぶ手順。

# 2. 現行実装の診断

## 2.1 現在の責務混在

baseline commit時点の `engine/chambers.ts` は、1クラスの中に以下を抱えている。

- 心拍位相からの解析的Ca release pulse
- 任意単位のCa状態 `c`
- 静的Hill型活性化状態 `a`
- 長さ依存Ca感受性 `Kd(lambda)`
- 別経路のforce–length gate `fIso(lambda)`
- overlap gate `gOver(lambda)`
- post-hoc force–velocity multiplier
- optional tension filter
- optional active-stretch lag `lambdaAct`
- low-stretch limiter群
- passive stress
- 厚肉球の幾何
- stress-to-pressure倍率 `geomChi/geomScale`
- 心房reservoir状態 `r`

現行のactive targetは概念的に次である。

\[
\sigma_{\mathrm{act,target}}
=
T_{\max}
\,s_T
\,\mathrm{contractility}
\,a
\,g_{\mathrm{over}}(\lambda)
\,f_{\mathrm{iso}}(\lambda)
\,f_v(\dot\lambda)
\]

同時に `contractility` はCa release amplitudeにも入る。そのため、少なくとも次の効果が識別不能である。

- Ca transient amplitude
- myofilament Ca sensitivity
- crossbridge recruitment/cycling
- maximal tissue stress
- organ-level inotropy

## 2.2 元の症状と中心仮説

本刷新の直接の動機の一つは、normal負荷下でのLVPが過度に鋭く、既存artifactで `LVPFwhmMs` が代表的に約92 msであったことである。この値は測定条件依存であり、人の正常目標値として扱わない。

中心仮説は次である。

```text
static Hill activation
+ duplicated length-dependent gain
+ post-hoc tension/velocity shaping
```

が、twitch morphologyと低前負荷feedbackを構造的に鋭くしている可能性が高い。Land kineticsはこの仮説を反証する第一候補である。

ただし、静的Hillが確定原因であるとは扱わない。loaded LVPはCa、crossbridge kinetics、shortening history、afterload、valve timing、qDot eventの合成結果である。Landへ置換してもloaded morphologyが改善しない可能性をRiskとgateへ明示する。

## 2.3 固定状態レイアウト

現行 `stateLayout.ts` はactive chamberごとに以下の5状態を固定配置している。

```ts
{ c, a, r, tensionPa, lambdaAct }
```

これは、Land 6状態、BCS 2状態、将来の別backendを同一エンジンに載せる構造ではない。また、心房reservoir状態 `r` がmyofilament stateと同居している。

## 2.4 自由倍率と同定不能性

現在の圧生成には概ね次の積が入る。

```text
Tmax0
× contractility
× tmaxScale
× geomChi
× geomScale
× wall geometry
```

観測されるのは主に最終圧と流量であり、これらを独立に同定することはできない。特に `Tmax0`、wall volume、reference geometry、sarcomere anchor、stress-to-pressure倍率を同時に自由fitしてはならない。

## 2.5 低前負荷period-2に関する注意

現行診断では、低前負荷period-2は単純な描画、warm start、名目弁逆流だけでは説明されていない。一方で、2026-06-12時点のmain記録では、AoV `qDot` clampが低前負荷branchにおける支配的なevent surfaceと評価されている。

したがって、本刷新では以下を区別する。

- `qDot` / valve / afterload系を**初期の構造置換対象にはしない**。
- しかしLand導入効果を判定する際の**必須対照軸からは外さない**。
- clampに支配された点をmyofilament校正データとして使用しない。
- 「Landでperiod-2が消えた」だけではroot-cause解決と判定しない。
- qDot/afterloadを変更せずに構造置換を評価し、その後にseparate-axis controlを行う。

静的Hillと二重の長さ依存ゲインは最有力構造要因の一つだが、確定原因とは表現しない。

# 3. Goals / Non-goals

## 3.1 Goals

### G1. activationとCaの意味分離

- rhythm、pacing、AV delay、electromechanical delayを `ActivationScheduler` が一元管理する。
- Ca backendへ `timeSec / phase / HR / event` の重複入力を渡さない。
- 初期Ca backendは `PrescribedCalciumTransientV1` と呼び、保存型Ca cyclingと誤認させない。
- CaはµMで表現する。

### G2. kinetic myofilament

- Land 2017の6状態をsource-accurateに実装する。
- force–Ca、length dependence、twitch、length-step、force–velocityを単一モデルで扱う。
- `lambdaAct`、post-hoc `fIso`、post-hoc force–velocity倍率を不要にする。
- continuous evaluationとdiscrete implicit updateの入力契約を分ける。

### G3. source stressとwall stressの分離

- Land source outputを、そのまま臓器wall stressと暗黙同一視しない。
- tissue fraction、orientation、homogenization ruleをversioned adapterへ隔離する。
- adapter parameterを隠れた `geomChi` として自由fitしない。

### G4. generalized virtual-power map

- pressureを自由倍率で合わせない。
- stress measure、strain measure、reference configuration、wall-volume measureを明記する。
- cavity volume、septal coordinate、AV-plane coordinate等に対する共役力を同じJacobianから返す。
- cavity pressureはvolume coordinateのconjugate forceとして扱う。
- activeは非保存generalized stress、passiveはenergy derivative、viscousはdissipationとして区別する。

### G5. 安定な数値結合

- myofilamentからstabilization coefficientを得る。
- implicit state updateを含むalgorithmic tangentをreference solveへ提供する。
- strainとstrain rateの離散整合性をbackend contractで保証する。
- 局所monolithic referenceを常設する。
- production partitioned/IMEX結果をreferenceと比較できる。

### G6. 階層的校正と同定可能性

- activation/Ca、myofilament、homogenization、geometry/passive、circulationを別段階で校正する。
- local sensitivity、parameter correlation、profile likelihood、multi-startを実行可能にする。
- 弁・循環誤差をTrefまたはhomogenization factorへ吸収しない。
- `reference volume` と `sarcomere anchor` が数値的に独立DOFであることをrank gateで確認する。

### G7. 早期反証

- isometricだけでなく、prescribed shorteningと複数minimal loaded protocolを本格統合前に実行する。
- cell/tissue protocolを保つparameter domainでjoint targetを満たせない場合、owner GO/REVISE/NO-GOを要求する。
- FWHMだけでなくtime-to-peak、width80/90、relaxation、ejection、SV、work、pressure amplitude、afterload responseを同時評価する。

### G8. future-proof state and mechanics boundary

- state instanceをchamberと同一視せず、wall/region/patchを追加できるpathを持つ。
- 初期runtimeでは一心室一global unitでも、schema破壊なしに複数unitを追加できる。
- thick-sphere、TriSeg-lite等のmechanics backendをmyofilament contractから分離する。

### G9. 教育用realtime

- reference solverとproduction solverの性能要件を分ける。
- productionはWeb Worker等でUI threadから分離し、暫定absolute performance budgetを満たす。
- performance問題を完成後の最適化へ先送りしない。

## 3.2 Non-goals

初期リリースでは以下を自動的な必須要件にしない。

- full ionic cell model
- ToR-ORd–Land coupling
- troponin bufferingをfree Caへ返す双方向結合
- full ECC platform
- RDQ20を4腔本番実装
- CMCの確率モデルをruntimeで解く
- TriSegまたはMultiPatchのruntime実装
- regional infarction / scar / CRT / LBBBのmechanistic patch model
- 全循環を一つのNewton solveへ統合
- valve/qDot/vascular topologyの全面刷新
- 旧caseとの数値互換
- LVパラメータを縮小しただけの心房モデル
- temperature値を渡すだけの未検証Q10モデル
- FWHM改善だけを目的とする波形flatteningまたはoutput suppression

ただし、次のofficial claimを行う前には追加modelが必要である。

| Claim / case | 必要な追加model |
|---|---|
| SERCA低下、RyR leak、SR load、post-rest potentiation、Ca alternans | conservative Ca cycling backend |
| septal flattening/bowingを主機序とするPH/RV failure | validated TriSeg-like mechanics |
| regional AMI、scar、dyssynchrony、CRT | patch/regional mechanics + activation field |

# 4. 科学的モデル選定

## 4.1 Land 2017を第一選択とする理由

Land 2017は、37°Cの人心筋データを用いて以下を同一構成で扱う。

- troponin C kinetics
- tropomyosin / regulatory unit kinetics
- weakly / strongly bound crossbridges
- crossbridge distortion
- force–Ca
- sarcomere-length dependence
- rapid length change
- constant-velocity shortening
- passive/viscoelastic cellular response

また、原著はskinned myocyteからintact muscle、whole-organへ移るときにCa感受性、協同性、crossbridge transition rateの調整が必要であることを示している。このため、source parameter setを次のように不変の別IDとして管理する。

```text
land2017-skinned-human-37c-source-v1
land2017-intact-human-37c-source-v1
land2017-whole-organ-source-v1
```

productionの出発点として推奨するのは `land2017-intact-human-37c-source-v1` である。0DSim向けに値を一つでも変更した場合は、source setを上書きせず、例えば次の別IDを発行する。

```text
land2017-intact-human-37c-0dsim-v1
```

whole-organ refined版は比較armとして保持する。原論文の臓器モデルに合わせた調整を、新しい0D geometry/circulationへ無批判に持ち込まない。

LV/RVは初期段階で同じLand kineticsを共有する。LV/RV差はまずwall mass、geometry、loading、passive propertiesから説明し、独立データなしにRV専用crossbridge kineticsを作らない。

## 4.2 BCSの位置づけ

BCSはactive stress `tau_c` とactive stiffness `k_c` を主要状態として持ち、series elasticityとenergy balanceを明示しやすい。状態数が少なく、Landの独立対照として有用である。

ただし初期リリースでは実装しない。BCS原型はLandと同じ `calciumUM + strain` input semanticsではないため、Revision 3では `MyofilamentBackendId` のunionへ先回りで含めない。Phase 9で、BCSのactivation control `u(t)` を保持した専用adapterと共通generalized-output contractを設計する。

Marchesseau版の時間駆動 `u(t)` と、将来のCa駆動改変版を混同しない。Ca駆動改変版を作る場合は `bcs-ca-v1` 等の別equation model IDとし、BCS既報版とは呼ばない。

## 4.3 RDQ20 / CMCの位置づけ

RDQ20-MFはより微視的で、CMC/Huxley系の縮約として有力である。しかし、今回の目的に対してはparameter count、校正プロトコル、chamber-specific adaptationが過剰である。

追加条件は「高忠実度だから」ではなく、Landで説明できない系統的model discrepancyが示された場合とする。CMC関連文献は、正式書誌が確認されたものだけをreference registryへ入れ、略称だけの曖昧な引用をnormative sourceにしない。

---

---

# 5. 新アーキテクチャ

## 5.1 レイヤ構成

```text
engine/myocardium/
├── contracts.ts
├── units.ts
├── provenance.ts
├── registry.ts
├── activation/
│   ├── ActivationScheduler.ts
│   ├── periodicActivationSchedulerV1.ts
│   └── __tests__/
├── state/
│   ├── ModelInstancePath.ts
│   ├── StateBlockDescriptor.ts
│   ├── StateLayoutBuilder.ts
│   └── stateValidation.ts
├── calcium/
│   ├── PrescribedCalciumTransient.ts
│   ├── prescribedBiExponentialV1.ts
│   ├── parameterSets.ts
│   ├── limitations.ts
│   └── __tests__/
├── myofilament/
│   ├── land2017/
│   │   ├── equations.ts
│   │   ├── continuous.ts
│   │   ├── discreteStep.ts
│   │   ├── outputs.ts
│   │   ├── parameterSets.ts
│   │   ├── residual.ts
│   │   ├── jacobian.ts
│   │   └── __tests__/
│   └── bcs/                 # Phase 9以降。専用activation semantics
├── homogenization/
│   ├── MyocardiumHomogenizationAdapter.ts
│   ├── identityFiberNominalV1.ts
│   └── __tests__/
├── mechanics/
│   ├── GeneralizedCoordinates.ts
│   ├── MyocardialKinematicsModel.ts
│   ├── thickSphereSpikeV1.ts
│   ├── production/          # Phase 4 owner decision後
│   └── __tests__/
├── material/
│   ├── PassiveMaterialModel.ts
│   ├── passiveExponentialV1.ts
│   └── __tests__/
├── generalizedForces/
│   ├── GeneralizedForceMapper.ts
│   ├── virtualPowerNominalEngineeringV1.ts
│   └── __tests__/
├── coupling/
│   ├── MyocardialUnit.ts
│   ├── localMonolithicReference.ts
│   ├── activeStiffnessPartitioned.ts
│   └── __tests__/
└── diagnostics/
    ├── MyocardialDiagnostics.ts
    └── energyAudit.ts

tools/myocardium/
├── verifyActivationScheduler.ts
├── verifyLandProtocols.ts
├── verifyPrescribedCalcium.ts
├── replayPrescribedShortening.ts
├── verifyMinimalLoadedProtocols.ts
├── verifyGeneralizedForces.ts
├── compareCouplingSolvers.ts
├── fitLandBridge.ts
└── identifiabilityReport.ts
```

既存 `engine/chambers.ts` は最終的に、elastance controlを別ファイルへ移したうえで削除または大幅縮小する。

## 5.2 依存方向

依存は一方向にする。

```text
activation
    → prescribed calcium
    → Land source myofilament
    → tissue homogenization
    → material + kinematics
    → generalized-force mapping
    → coupling
    → ModelCore
```

禁止する依存:

- myofilamentからvalve状態またはchamber pressureを読む。
- prescribed Ca backendからwall geometryを読む。
- activation schedulerからCa amplitudeやLand parameterを変更する。
- homogenization adapterからclinical knobを読む。
- generalized-force mapperからclinical knobまたはvalve状態を読む。
- UI/domain case型をequations層へimportする。

## 5.3 Development configurationとproduction configuration

Phase 1–3のearly spikeでは、次を使用する。

```text
ActivationSchedulerV1
+ PrescribedCalciumTransientV1
+ Land source backend
+ identity/narrow-prior homogenization
+ thickSphereSpikeV1
+ one volume generalized coordinate
+ simple afterload family
```

Phase 4以降のproduction configurationは、ownerがmechanics backendを選んでから固定する。early spike geometryを、そのままproduction既定に昇格させない。

## 5.4 将来拡張の契約

初期runtimeで一心室一global unitだけを生成しても、各state blockとdiagnosticは `ModelInstancePath` を持つ。将来は同じcontractで、例えば次を表現できる。

```text
LV / free-wall / global / unit-1
RV / free-wall / global / unit-1
Septum / septal-wall / global / unit-1
LV / free-wall / anterior / patch-1
```

これはMultiPatch実装を意味しない。**二度目のstate-schema破壊を避けるためのnamespace設計**である。

# 6. 単位・命名規約

## 6.1 内部単位

| 量 | 内部単位 |
|---|---|
| time | s |
| Ca concentration | µM |
| source/wall generalized stress | Pa |
| stiffness / tangent | Pa |
| force conjugate to volume | Pa (= J/m³) |
| force conjugate to displacement | N |
| power / power density | W / W·m⁻³ |
| fiber stretch ratio / engineering strain | dimensionless |
| strain rate | s⁻¹ |
| sarcomere length | m（表示はµm可） |
| myocardium-layer volume | m³ |
| circulation public volume | mL |
| myocardium-layer pressure | Pa |
| public hemodynamic pressure | mmHg |
| temperature | K、parameter/provenanceで固定 |

## 6.2 API命名

ownerが推奨default（nominal stress＋engineering strain）を承認した場合、public fieldは次を用いる。

MUST:

```ts
freeCalciumUM
sourceActiveFiberStressPa
wallActiveNominalStressPa
stabilizationStiffnessPa
algorithmicTangentPa
fiberStretchRatio
fiberEngineeringStrain
sarcomereLengthM
wallReferenceVolumeM3
generalizedCoordinateIds
conjugateForcesSI
transmuralPressurePa
```

MUST NOT:

```ts
c
tension
stiffness
lambda
strain
volume
pressure
releaseFlux
removalFlux
```

のように、単位・measure・物理的保存性が不明なpublic fieldを新設する。

`activeTensionPa` は禁止する。`tension`が力か応力か曖昧だからである。

## 6.3 変換境界

- `mL ↔ m³` と `mmHg ↔ Pa` はchamber/circulation境界の1箇所に限定する。
- Land equation内部でmmHgまたはmLを使用しない。
- parameter fixtureには原著単位とruntime単位の両方を記録する。
- `temperatureK` は毎step入力にせず、初期版では `fixed-310.15K-v1` parameter/provenanceとして固定する。
- source stressからwall stressへの変換はhomogenization adapter外へ分散させない。
- generalized coordinateのunitとconjugate forceのunitをdescriptorへ保存する。

# 7. 共通インターフェース

以下のTypeScript例は、推奨defaultである `nominal fiber scalar stress + engineering fiber strain` を仮定する。owner sign-off前は **RECOMMENDED / PENDING OWNER SIGN-OFF** である。

## 7.1 Provenance

```ts
export type ModelProvenance = {
  equationsVersion: string;
  parameterSetId: string;
  parameterSetSha256: string;
  activationModelId: string;
  calciumModelId: string;
  homogenizationModelId: string;
  mechanicsModelId: string;
  generalizedForceModelId: string;
  calibrationDatasetIds: readonly string[];
  validationTargetPackIds: readonly string[];
  calibrationCodeVersion: string;
  solverVersion: string;
  stateSchemaVersion: number;
  temperatureModelId: "fixed-310.15K-v1" | string;
  decisionBaselineId: string;
  sourceReferences: readonly string[];
  modelLimitations: readonly string[];
};
```

simulation result、snapshot、verification artifactへ必ず埋め込む。

## 7.2 Patch-ready可変state block

```ts
export type ModelInstancePath = {
  chamber?: "LV" | "RV" | "LA" | "RA";
  wallId?: string;
  regionId?: string;
  patchId?: string;
  moduleId: string;
  instanceId: string;
};

export type StateBlockDescriptor = {
  blockId: string;
  owner: "activation" | "calcium" | "myofilament" | "mechanics";
  instance: ModelInstancePath;
  labels: readonly string[];
  size: number;
  equationsVersion: string;
};

export type StateBlockSlice = {
  descriptor: StateBlockDescriptor;
  offset: number;
  size: number;
};

export type DynamicStateLayout = {
  blocks: readonly StateBlockSlice[];
  size: number;
  layoutHash: string;
};
```

要件:

- state sizeはbackend instanceから取得する。
- `makeIndex()` にLand固有fieldを直書きしない。
- chamberとmyofilament unitを1対1と仮定しない。
- temporary atrial elastance bridgeはCa/myofilament blockを持たなくてよい。
- state labelsとinstance pathをsnapshot診断へ保存する。
- layout hashはblock ID、equation version、instance path、labels、offsetを含める。
- 新schemaでは `MODEL_STATE_SCHEMA_VERSION` と `MODEL_VERSION` を更新する。
- 旧schemaのunpackは明示的に拒否する。

## 7.3 Activation scheduler

```ts
export type ActivationTargetId = string;

export type ActivationEventInput = {
  targetId: ActivationTargetId;
  activationEventId: number;
  timeSinceActivationSec: number;
  cycleLengthSec: number;
  activationStrength01: number;
};

export type ActivationSchedulerOutput = {
  events: readonly ActivationEventInput[];
  rhythmCycleId: number;
};

export interface ActivationScheduler<Params> {
  readonly id: "periodic-activation-scheduler-v1" | string;
  reset(timeSec: number, params: Params): void;
  advance(previousTimeSec: number, nextTimeSec: number, params: Params): ActivationSchedulerOutput;
}
```

`heartRateBpm` は `cycleLengthSec` から導出する。Ca backendへ絶対時刻、phase、event、HRを重複して渡さない。

## 7.4 Prescribed calcium transient

```ts
export type PrescribedCalciumInput = ActivationEventInput & {
  dtSec: number;
};

export type PrescribedCalciumOutput = {
  freeCalciumUM: number;
  riseState01: number;
  decayState01: number;
  releaseDriveUMPerSec?: number;
  clearanceDriveUMPerSec?: number;
};

export interface PrescribedCalciumTransient<Params> {
  readonly id: "prescribed-calcium-transient-v1" | string;
  readonly state: StateBlockDescriptor;

  initialState(params: Params, out: Float64Array): void;

  residual(
    next: Float64Array,
    previous: Float64Array,
    input: PrescribedCalciumInput,
    params: Params,
    outResidual: Float64Array,
  ): void;

  evaluate(
    state: Float64Array,
    input: PrescribedCalciumInput,
    params: Params,
  ): PrescribedCalciumOutput;
}
```

`releaseDrive` / `clearanceDrive` は保存型SR/cytosol fluxではない。UIやcase recipeでSERCA/RyR fluxとして表示してはならない。

## 7.5 Myofilament continuous input

```ts
export type LandContinuousInput = {
  freeCalciumUM: number;
  fiberEngineeringStrain: number;
  fiberEngineeringStrainRatePerSec: number;
};
```

これはprotocol replay、diagnostic、continuous RHS評価にのみ使用する。

## 7.6 Myofilament discrete step input

```ts
export type IntegrationStageDescriptor =
  | { scheme: "BE"; stageIndex: 0 }
  | { scheme: "SDIRK2"; stageIndex: 0 | 1; gamma: number };

export type LandStepInput = {
  freeCalciumUM: number;
  previousFiberEngineeringStrain: number;
  stageFiberEngineeringStrain: number;
  dtSec: number;
  stage: IntegrationStageDescriptor;
};

export type LandStepKinematics = {
  stageFiberEngineeringStrainRatePerSec: number;
};
```

stage adapterが、採用schemeの離散関係からstrain rateを一意に構成する。callerがstage strainとrateを独立指定してはならない。

## 7.7 Land source output

```ts
export type LandSourceOutput = {
  sourceActiveFiberStressPa: number;
  sourceStressConvention: "land2017-Ta";

  stabilizationStiffnessPa: number;
  algorithmicTangentPa?: number;
  frozenStateTangentPa?: number;

  sourceActivePowerDensityWPerM3: number;

  health: {
    finite: boolean;
    stateConservationResidual: number;
    minimumPopulation: number;
    projectionUsed: boolean;
  };
};

export interface LandMyofilamentModel<Params> {
  readonly id: "land2017-myofilament-v1";
  readonly state: StateBlockDescriptor;

  initialState(
    input: LandContinuousInput,
    params: Params,
    out: Float64Array,
  ): void;

  residual(
    next: Float64Array,
    previous: Float64Array,
    input: LandStepInput,
    params: Params,
    outResidual: Float64Array,
  ): void;

  evaluateContinuous(
    state: Float64Array,
    input: LandContinuousInput,
    params: Params,
  ): LandSourceOutput;

  evaluateStep(
    state: Float64Array,
    input: LandStepInput,
    params: Params,
  ): LandSourceOutput;
}
```

初期版のbackend ID unionにBCSを含めない。

## 7.8 Tissue homogenization adapter

```ts
export type HomogenizationInput = {
  source: LandSourceOutput;
  instance: ModelInstancePath;
  wallReferenceVolumeM3: number;
};

export type HomogenizedActiveOutput = {
  wallActiveNominalStressPa: number;
  wallStabilizationStiffnessPa: number;
  wallAlgorithmicTangentPa?: number;
  homogenizationModelId: string;
  activeTissueFraction: number;
  orientationRuleId: string;
};

export interface MyocardiumHomogenizationAdapter<Params> {
  readonly id: string;
  evaluate(input: HomogenizationInput, params: Params): HomogenizedActiveOutput;
}
```

初期候補は、明示的なsource conventionを保つ `identity-fiber-nominal-v1` とする。active tissue fractionやorientation efficiencyを導入する場合は、独立データ・狭いprior・identifiability gateを要求する。

## 7.9 Generalized coordinatesとkinematics

```ts
export type GeneralizedCoordinateUnit = "m3" | "m";

export type GeneralizedCoordinateState = {
  id: string;
  valueSI: number;
  previousValueSI: number;
  rateSI: number;
  unit: GeneralizedCoordinateUnit;
};

export type MyocardialKinematicsInput = {
  coordinates: readonly GeneralizedCoordinateState[];
  instance: ModelInstancePath;
};

export type MyocardialKinematicsOutput = {
  sarcomereLengthM: number;
  fiberStretchRatio: number;
  fiberEngineeringStrain: number;
  fiberEngineeringStrainRatePerSec: number;
  coordinateIds: readonly string[];
  dStrainDCoordinate: Float64Array;
  wallReferenceVolumeM3: number;
  geometryHealth: {
    finite: boolean;
    inCalibrationDomain: boolean;
  };
};

export interface MyocardialKinematicsModel<Params> {
  readonly id: string;
  evaluate(input: MyocardialKinematicsInput, params: Params): MyocardialKinematicsOutput;
}
```

`dStrainDCoordinate[i] = ∂E_f/∂q_i` である。

## 7.10 Passive material

```ts
export type PassiveMaterialOutput = {
  passiveNominalStressPa: number;
  viscousNominalStressPa: number;
  dPassiveStressDStrainPa: number;
  storedEnergyDensityJPerM3: number;
  dissipationDensityWPerM3: number;
};
```

activeとpassiveは別モデルとして評価し、generalized-force mapperで一般化応力レベルに合成する。

## 7.11 Generalized-force mapper

```ts
export type GeneralizedForceInput = {
  kinematics: MyocardialKinematicsOutput;
  active: HomogenizedActiveOutput;
  passive: PassiveMaterialOutput;
};

export type GeneralizedForceOutput = {
  coordinateIds: readonly string[];
  conjugateForcesSI: Float64Array;
  activeContributionsSI: Float64Array;
  passiveContributionsSI: Float64Array;
  viscousContributionsSI: Float64Array;
  virtualPowerResidualW: number;
  volumeCoordinatePressurePa?: Readonly<Record<string, number>>;
};

export interface GeneralizedForceMapper {
  readonly id: "virtual-power-nominal-engineering-v1" | string;
  evaluate(input: GeneralizedForceInput): GeneralizedForceOutput;
}
```

volume coordinateのconjugate forceはPa、displacement coordinateのconjugate forceはNになる。external/pericardial pressureはmyocardial internal forceとは別レイヤで加算する。

## 7.12 De-risking harness contracts

```ts
export type PrescribedMyocardialTrajectory = {
  timeSec: Float64Array;
  freeCalciumUM: Float64Array;
  fiberEngineeringStrain: Float64Array;
};

export type MinimalLoadedProtocol = {
  id: "afterload-low" | "afterload-normal" | "afterload-high";
  anatomyParameterSetId: string;
  kinematicsModelId: "thick-sphere-spike-v1";
  generalizedForceDecisionId: string;
  afterloadModelId: "two-element-afterload-v1";
  useDynamicValve: false;
  useQDotClamp: false;
  allowFreeGeometryScale: false;
  allowFreeHomogenizationGain: false;
};
```

strain rateはtime/strain pathからharnessが整合的に計算する。このharnessはearly falsification専用であり、runtime fallbackにしてはならない。

# 8. Land 2017 backend実装仕様

## 8.1 Equation model ID、parameter sets、状態

equation model ID:

```text
land2017-myofilament-v1
```

source parameter setは混ぜずに別IDとする。

```text
land2017-skinned-human-37c-source-v1
land2017-intact-human-37c-source-v1
land2017-whole-organ-source-v1
```

初期候補は `land2017-intact-human-37c-source-v1` とする。値を1つでも変更した場合はsource setを上書きせず、派生IDとmachine-readable patchを発行する。

state labels:

```text
CaTRPN
B
W
S
zetaW
zetaS
```

`U = 1 - B - W - S` を導出状態として扱う場合、保存残差を毎評価で監査する。

## 8.2 実装原則

- 方程式は採用版の式番号と1対1でコメントする。
- parameter名は原著名を保ち、app aliasをequations層に入れない。
- skinned、intact、whole-organ parameterを混ぜない。
- LV/RVは初期段階で同じintact-human kineticsを共有する。
- source page/table/equationをparameter metadataへ残す。
- silent population clampを禁止する。
- positivity違反はline search、step rejection、substepで扱う。
- projectionはdebug fallbackに限定し、production acceptanceでは `projectionUsed=false` を要求する。

## 8.3 Source stress conventionとwall stressを分ける

**RECOMMENDED / PENDING OWNER SIGN-OFF**

Land `T_a` はsource model内で、engineering fiber strainに共役なfiber nominal / first-Piola scalar stressとして解釈する。この決定はequations、active-stiffness、tangentの内部整合を固定する。

ただし、Landのcell/tissue tensionを、そのままwall-average stressと同一視しない。

```text
Land T_a
  = sourceActiveFiberStressPa

TissueHomogenizationAdapter(sourceActiveFiberStressPa)
  = wallActiveNominalStressPa
```

homogenization adapterは、active tissue fraction、fiber orientation rule、wall averagingを明示し、provenanceを持つ。`Tref`、wall mass、homogenization gainの間で同じnormal pressureを自由に作れる構造は禁止する。

## 8.4 Discrete strain-rate consistencyとtangent

implicit schemeではrateを独立inputにしない。

BE:

\[
\dot E_f^{n+1}
=
\frac{E_f^{n+1}-E_f^n}{\Delta t}
\]

SDIRK2ではButcher tableauとstage historyからstage rateを導出する。algorithmic tangentの有限差分は、stage strainを摂動し、consistent rateを再計算し、stateを再solveして行う。

次の3量を分ける。

```text
stabilizationStiffnessPa
    partitioned stabilization用のmodel-defined coefficient。

algorithmicTangentPa
    discrete implicit mapの dT[n+1]/dE[n+1]。

frozenStateTangentPa
    state固定の診断用偏微分。
```

stabilization coefficientをalgorithmic tangentへ一致させることは要求しない。

## 8.5 Land単体の必須protocol

`ModelCore`へ接続する前に以下を通す。

1. steady-state force–Ca at multiple sarcomere lengths
2. isometric twitch
3. time to peak、FWHM、width80/90、relaxation
4. rapid positive/negative length step
5. constant-velocity shortening
6. force–velocity curve
7. length-dependent twitch prolongation
8. prescribed-shortening replay
9. state conservation / positivity
10. time-step convergence
11. stabilization coefficient source check
12. algorithmic tangent vs re-solved finite difference
13. deterministic reproducibility

各fixtureはsource、figure/table、digitization、unit conversion、tolerance rationale、fit/validation/holdout roleを持つ。

## 8.6 Homogenization acceptance

- identity adapter testではsource stressとwall stressが一致する。
- non-identity adapterは各係数の独立sourceを持つ。
- wall stress、wall mass、geometryを同一PV loopだけで同時fitしない。
- active tissue fractionとorientation ruleのsensitivityをidentifiability reportへ含める。
- adapterを使わずsource outputをgeneralized-force mapperへ直結することを禁止する。

# 9. PrescribedCalciumTransientV1

## 9.1 目的とclaim boundary

`PrescribedCalciumTransientV1` はfull ECCまたはCa cycling modelではない。canonical activation eventから、Land反証と初期production候補に用いるdimensional free-Ca waveformを生成する。

表現できるもの:

- diastolic/peak free Ca
- rise/decay timing
- activation delay
- rate-dependent waveform profile
- phenomenological Ca-amplitude / clearance-time intervention

表現しないもの:

- SR Ca inventory
- RyR availability / leak
- SERCA flux / PLB state
- post-rest potentiation
- Ca alternans arising from inventory dynamics
- troponin buffering feedback to free Ca

このbackendでSERCA、RyR、SR loadをmechanistic official caseとして表示してはならない。

## 9.2 推奨構造

\[
\dot y_r = \frac{s(t)-y_r}{\tau_r}
\]

\[
\dot y_d = \frac{y_r-y_d}{\tau_d}
\]

\[
[Ca^{2+}]_i
=
Ca_{dia}+A_{Ca}\frac{y_d}{N(\tau_r,\tau_d,w)}
\]

- `s(t)` はActivationEventから生成するC1 pulse。
- `N` は指定parameterでpeak amplitudeが `A_Ca` になるよう事前計算する。
- `tau_r < tau_d` をvalidationする。
- exact exponential updateまたはimplicit updateを使う。
- event IDが同じ間はphaseを外部から再指定しない。

## 9.3 Parameter setとHR dependence

```ts
export type CalciumRateTarget = {
  cycleLengthSec: number;
  diastolicCalciumUM: number;
  peakAmplitudeUM: number;
  riseTimeSec: number;
  decayHalfTimeSec: number;
  releaseWidthSec: number;
};

export type PrescribedCalciumParams = {
  rateTargets: readonly CalciumRateTarget[];
  interpolation: "monotone-cubic" | "piecewise-linear";
  activationDelaySec: number;
  parameterSetId: string;
  temperatureModelId: "fixed-310.15K-v1";
};
```

HRはcycle lengthから導出し、APIへ重複入力しない。knot外の外挿方針を明示する。

## 9.4 Target strategy

1. `ca-land2017-intact-paired-v1`: intact-human Landと組み合わせてintact twitchを再現するpaired target。
2. `ca-human-ventricular-37c-rate-v1`: human ventricular myocyteのdiastolic/peak/time-to-peak/decay/rate target。

cell model outputはinterpolation aidまたはnegative controlとして扱い、experimental targetの代替にしない。

## 9.5 禁止事項

- Ca amplitudeとLand `Tref`を一つの`contractility`で同時変更しない。
- Ca backendにfiber stretchを入力しない。
- 任意単位 `[0,1]` CaをLandへ渡さない。
- LVPだけでCa decayとcrossbridge detachmentを同時fitしない。
- `releaseFlux` / `removalFlux` と呼ぶ物理fluxを保存式なしで公開しない。
- `temperatureK` をruntime knobとして露出しない。

## 9.6 Validation

- waveform peak、time to peak、decay half-time
- event/cycle continuity
- knot interpolation / extrapolation policy
- dt convergence
- no negative Ca
- activation event consistency
- deterministic replay

## 9.7 Future ConservativeCalciumCyclingV1 gate

次のいずれかをofficial caseで機序的に扱う前に、保存型Ca backendを別ADRで実装する。

```text
SERCA depression
RyR leak / availability
SR Ca depletion or loading
post-rest potentiation
Ca alternans
beta/PLB pathway
CaTRPN buffering feedback
```

必要最小状態、保存則、flux balance、Landとの双方向couplingはそのADRで定義する。

# 10. Chamber kinematics、reference configuration、production mechanics decision

## 10.1 分離すべき量

```text
cavity reference / anchor volume
wall reference volume or mass
Land slack/reference sarcomere length
absolute sarcomere length at geometry anchor
passive slack configuration
geometry shape parameters
mechanics backend coordinates
```

## 10.2 Early thick-sphere kinematics

Phase 3のLand-first spikeでは、thick-sphere geometryを固定harnessとして使う。

\[
\rho_g(V)=\frac{r_m(V)}{r_m(V_{anchor})}
\]

\[
L_s(V)=L_{s,anchor}\rho_g(V)
\]

\[
E_f(V)=\frac{L_s(V)}{L_{s,0}}-1
\]

ここでthick-sphereはearly hypothesisを安価に検証するための選択であり、production ventricular mechanicsを自動的に確定しない。

## 10.3 Generalized-coordinate kinematics

一般形では、

\[
E_f=E_f(q_1,\ldots,q_m)
\]

とし、outputは

\[
\frac{\partial E_f}{\partial q_i}
\]

を全coordinateについて返す。

Phase 3:

```text
q = [cavity-volume]
```

将来例:

```text
q = [LV-volume, RV-volume, septal-coordinate, AV-plane-displacement]
```

## 10.4 Parameter freedom policy

- `Ls0`: Land source setから固定。
- `Ls,anchor`: 独立dataから固定または狭いprior。
- `Vanchor`: imaging/anatomyから固定。
- `Vw0`: myocardial mass/volume targetから固定。
- `Tref`: source valueを基本固定。変更時は派生parameter set。
- homogenization parameterは独立sourceを持つ。

これらを同一PV loopへ自由fitしない。

## 10.5 Identifiability gate

MUST:

- scaled sensitivity matrixとnumerical rankを保存する。
- `Vanchor`、`Ls,anchor`、`Vw0`、`Tref`、homogenization列の共線性を報告する。
- rank deficientならparameterを固定・統合・再parameterizeする。
- profile likelihoodが開くparameterをproduction free parameterにしない。
- geometry familyを変えた場合、target、rank、morphologyを再評価する。

## 10.6 Production ventricular mechanics backend

Phase 4前にownerが次を選ぶ。

```text
A. thick-sphere-v2 + explicit external septal coupling
B. TriSeg-lite compatible backend
C. full TriSeg-compatible backend
```

選択基準:

- first official casesで必要なventricular interaction
- geometry/strain validation data
- parameter identifiability
- realtime performance
- generalized-force/virtual-power closure

TriSegはRV pressure overload、septal bowing、ventricular interdependenceを中核機序として扱う場合に優先候補となる。一方、正常morphology、global preload/afterload、global LV/RV failureの初期releaseではthick-sphereを採る余地を残す。

## 10.7 AV-plane、septum、regional extension

- AV-plane、septumはmyofilament stateへ入れない。
- coordinateを追加する場合、対応するconjugate forceとvirtual-power testを同時に追加する。
- patch-ready state schemaを使うが、regional runtimeは別ADRまで実装しない。

# 11. Work-conjugate generalized-force mapping

## 11.1 基本原理

active、passive、viscousを同じwall generalized stress measureで合成する。

\[
S_{total}=T_{active}+S_{passive}+S_{viscous}
\]

passiveのみがstored energyから得られる。

\[
S_{passive}=\frac{\partial\Psi_{passive}}{\partial E_f}
\]

一般化coordinateを `q_i` とすると、virtual powerは

\[
V_{w0}S_{total}\dot E_f
=
\sum_i Q_i\dot q_i
\]

であり、

\[
Q_i
=
V_{w0}S_{total}\frac{\partial E_f}{\partial q_i}
\]

となる。

volume coordinateの `Q_i` はPaであり、sign conventionによりtransmural pressureへ解釈する。septal/AV-plane displacement coordinateの `Q_i` はNである。

## 11.2 Powerとenergy

\[
\dot W_{passive}=V_{w0}S_{passive}\dot E_f
\]

\[
\mathcal P_{active}=V_{w0}T_{active}\dot E_f
\]

\[
\mathcal D_{viscous}=V_{w0}S_{viscous}\dot E_f\ge 0
\]

active potentialの存在を仮定しない。

## 11.3 Phase 0/4で固定する事項

- source stress convention
- wall stress convention
- strain measure
- reference configuration
- wall reference volume
- homogenization rule
- generalized coordinate IDs、units、signs
- active/passive/viscous composition
- pressure/external pressure sign convention

## 11.4 Virtual-power tests

単一coordinate:

\[
Q\,\delta q
\approx
V_{w0}S\,\delta E_f
\]

複数coordinate:

\[
\sum_i Q_i\dot q_i
\approx
V_{w0}S_{total}\dot E_f
\]

MUST:

- coordinateごとのactive/passive/viscous contributionを検証する。
- random direction vectorでmulti-coordinate directional derivativeを検証する。
- near-zero powerはabsolute toleranceを使う。
- unitsをcoordinate別に検証する。
- coordinate追加PRはvirtual-power test追加なしにmergeしない。

## 11.5 削除する自由倍率

```text
geomChi
lvGeomScale
rvGeomScale
```

を新モデルへ設けない。homogenization parameterを導入する場合は物理的名称、単位/範囲、独立source、identifiability evidenceを持たせる。

# 12. Passive material

## 12.1 activeと分離

Land backendは初期版でactive myofilament responseを担当する。chamber passive responseは別backendとする。

```text
active nominal stress   ← Land
passive nominal stress  ← PassiveMaterialModel
viscous nominal stress  ← PassiveMaterialModel または独立dashpot
pressure mapping        ← GeneralizedForceMapper
```

Land原著の細胞passive/viscoelastic部分を使用する場合、chamber passive lawと二重加算しない。採用は別ADRとする。

## 12.2 推奨初期passive law

**RECOMMENDED / PENDING OWNER SIGN-OFF**

旧stress parameterを再利用せず、engineering strainに対するconvex exponential energy familyを新規実装する。

概念例:

\[
x=h_\epsilon(E_f-E_{slack})
\]

\[
\Psi_{passive}(x)
=
\frac{A}{B^2}
\left(e^{Bx}-1-Bx\right)
\]

\[
S_{passive}
=
\frac{\partial \Psi_{passive}}{\partial E_f}
\]

ここで `h_epsilon` はC1/C2 smooth positive hingeである。

要件:

- `A` はPa、`B` はdimensionlessとする。
- slack strainとsmooth widthを明示する。
- zero strain/zero extension近傍でenergy、stress、tangentを検証する。
- compression側の挙動を定義する。
- stress/tangentをenergy derivativeから生成する。
- `sigmaPas0/bPas/lambdaPas0` の旧値を移植しない。
- pressure floorでpassive lawの問題を隠さない。

## 12.3 Viscosity

初期候補は、同じengineering strainに共役なdashpotとする。

\[
S_{viscous}=\eta_f\dot E_f
\]

\[
S_{viscous}\dot E_f\ge 0
\]

ただし、viscosityはLVP幅を合わせるための自由な波形filterにしてはならない。独立protocolまたは狭いpriorで拘束する。

# 13. 数値積分・結合

## 13.1 方針

Reference:

```text
Land states + local generalized coordinates + generalized forces
```

を同一非線形solveで解く局所monolithic solver。

Production:

Landを局所implicitに解き、active-stiffness stabilizationを使って既存循環outer stepへ接続するpartitioned/IMEX solver。

## 13.2 DiscreteKinematicsAdapter

callerはimplicit residualへstrainとstrain rateを別々に渡さない。

```ts
export interface DiscreteKinematicsAdapter {
  stageStrainRate(
    previousStrain: number,
    stageStrain: number,
    dtSec: number,
    scheme: "BE" | "SDIRK2",
    stageIndex: number,
  ): number;
}
```

同じadapterをresidual、algorithmic tangent、FD test、diagnosticsに使う。

## 13.3 局所monolithic reference

未知量の例:

```text
next Land states
next generalized coordinate vector
next conjugate-force vector
```

要件:

- BE bring-upとSDIRK2 release reference。
- residual norm、iteration、line searchを記録。
- FD Jacobianとの照合。
- full circulation、valve diode、TBV projectionまでmonolithic化しない。
- multi-coordinate backend選択時は全coordinateを同一virtual-power systemへ含める。

## 13.4 Production coupling

1. circulation/mechanics predictorから `q*` を得る。
2. kinematicsからstage strainと`dE/dq`を得る。
3. DiscreteKinematicsAdapterがconsistent stage strain rateを作る。
4. activation→prescribed Ca→Land stateをimplicit更新する。
5. Land source outputをhomogenizationする。
6. passive/viscous stressと合成し、generalized forcesを得る。
7. active-stiffness stabilizationを含めcoordinate/flowをcorrectする。
8. local convergence、event、failureを判定する。

## 13.5 Active-stiffness stabilization

schematic form:

\[
T_a^{n+1}+K_a^{n+1}(E_f^{n+1}-E_f^n)
\]

実装式は採用論文定義と選択したmeasure pairへ合わせて導出する。`K_a` はalgorithmic tangentではない。

## 13.6 BEからSDIRK2

- equation bring-up: BE
- initial reference: BE
- release reference: SDIRK2または同等2次法
- production: accuracy/performance benchmarkで決定

比較matrixは `dt = 1.0, 0.5, 0.25 ms` を最低限含める。production BEを許す誤差閾値はversioned policyに保存する。

## 13.7 Time steppingとfailure

- prescribed Ca linear stateはexact exponentialまたはimplicit update。
- outer circulationは初期段階で既存Heunを維持してよい。
- non-finite stateを0へ置換しない。
- Newton failure時にlegacy active-stressへfallbackしない。
- step rejection/substepとfailure reasonをhealthへ出す。

## 13.8 Realtime performance budget

**RECOMMENDED / PENDING OWNER SIGN-OFF**

```text
normal four-chamber workload:
- >= 10 simulated seconds / wall second
- 60 simulated seconds <= 6 wall seconds
- parameter change -> first updated sample <= 150 ms
- no main-thread simulation
- no main-thread long task > 50 ms attributable to simulation
```

reference solverはperformance gate対象外。production geometry backendごとにmedian/p95、allocation、Newton/substep distributionを報告する。

# 14. 診断・observability

```ts
export type MyocardialDiagnostics = {
  path: ModelInstancePath;

  activation?: {
    activationEventId: number;
    timeSinceActivationSec: number;
    cycleLengthSec: number;
  };

  freeCalciumUM?: number;
  sarcomereLengthM?: number;
  fiberStretchRatio?: number;
  fiberEngineeringStrain?: number;
  fiberEngineeringStrainRatePerSec?: number;

  land?: {
    CaTRPN: number;
    B: number;
    U: number;
    W: number;
    S: number;
    zetaW: number;
    zetaS: number;
  };

  sourceActiveFiberStressPa?: number;
  wallActiveNominalStressPa?: number;
  passiveNominalStressPa: number;
  viscousNominalStressPa: number;
  stabilizationStiffnessPa?: number;
  algorithmicTangentPa?: number;
  frozenStateTangentPa?: number;

  generalizedForces?: {
    coordinateIds: readonly string[];
    conjugateForcesSI: readonly number[];
    activeContributionsSI: readonly number[];
    passiveContributionsSI: readonly number[];
    viscousContributionsSI: readonly number[];
  };

  activePowerDensityWPerM3?: number;
  passiveStoredEnergyJ: number;
  viscousDissipationW: number;
  virtualPowerResidualW: number;

  morphology?: {
    isometricTensionFwhmMs?: number;
    prescribedShorteningTensionFwhmMs?: number;
    loadedPressureFwhmMs?: number;
    loadedPressureTimeToPeakMs?: number;
    relaxationTauMs?: number;
    ejectionDurationMs?: number;
  };

  solver: {
    kind: string;
    iterations: number;
    residualNorm: number;
    substeps: number;
    stepRejected: boolean;
  };

  health: {
    finite: boolean;
    stateConservationResidual: number;
    minimumPopulation?: number;
    projectionUsed: boolean;
    kinematicsInDomain: boolean;
    targetPackIds: readonly string[];
  };
};
```

旧active-stress診断名とのcompatibility aliasは作らない。

stage-to-stage morphology report:

```text
isometric tension
→ prescribed-shortening tension
→ low/normal/high-afterload minimal chamber
→ production single chamber
→ full closed-loop LVP
```

source stress→wall stress→generalized forceの各段で、振幅とshapeがどのように変化したかも追跡する。

# 15. Parameter schema

## 15.1 Myocardium instance spec

```ts
export type MyocardiumInstanceSpec = {
  path: ModelInstancePath;

  activation: {
    modelId: "activation-scheduler-v1";
    parameterSetId: string;
  };

  calcium?: {
    modelId: "prescribed-calcium-transient-v1";
    parameterSetId: string;
  };

  myofilament?: {
    modelId: "land2017-myofilament-v1";
    parameterSetId: string;
  };

  homogenization?: {
    modelId: string;
    parameterSetId: string;
  };

  kinematics: {
    modelId: string;
    parameterSetId: string;
  };

  passiveMaterial: {
    modelId: "passive-exponential-energy-v1";
    parameterSetId: string;
  };

  generalizedForceMapper: {
    modelId: "virtual-power-generalized-force-v1";
  };

  coupling: {
    modelId: "active-stiffness-partitioned-v1" | "atrial-elastance-bridge-v1";
    referenceModelId?: "local-monolithic-be-v1" | "local-monolithic-sdirk2-v1";
  };

  temperatureModelId: "fixed-310.15K-v1";
};
```

## 15.2 Parameter set IDs

```text
activation-sinus-av-v1
prescribed-calcium-lv-human-rest-rate-v1
prescribed-calcium-rv-human-rest-rate-v1
land2017-intact-human-37c-source-v1
land2017-intact-human-37c-0dsim-v1
homogenization-global-fiber-v1
kinematics-lv-thick-sphere-v2
kinematics-rv-thick-sphere-v2
passive-lv-exponential-energy-v1
passive-rv-exponential-energy-v1
atrial-elastance-bridge-la-v1
atrial-elastance-bridge-ra-v1
```

## 15.3 Clinical intervention and claim policy

Prescribed-Ca版で許されるintervention ID:

```ts
export type MyocardialIntervention =
  | { id: "prescribed-calcium-amplitude-v1"; target: ModelInstancePath; multiplier: number }
  | { id: "prescribed-calcium-decay-time-v1"; target: ModelInstancePath; multiplier: number }
  | { id: "myofilament-ca-sensitivity-v1"; target: ModelInstancePath; shift: number }
  | { id: "crossbridge-cycling-v1"; target: ModelInstancePath; multiplier: number }
  | { id: "viable-contractile-fraction-v1"; target: ModelInstancePath; fraction01: number }
  | { id: "passive-stiffness-v1"; target: ModelInstancePath; multiplier: number };
```

`serca-depression`、`ryr-leak`、`sr-load`等は、保存型Ca backendなしに定義しない。UIのinotropy/lusitropyはversioned recipeへ解決し、mechanistic claim levelを表示する。

## 15.4 Target packs

```text
land2017-cell-protocols-v1
prescribed-ca-human-ventricular-37c-rate-v1
myocardial-morphology-human-v1
normal-adult-rest-bsa1p8-v1
myocardial-performance-reference-hardware-v1
```

各targetは `fit | validation | holdout | sanity` の役割を持つ。

# 16. 校正戦略

## 16.1 Level 0 — target definition and freeze

parameter fit前に、Ca、Land protocol、geometry、passive、loaded morphology、hemodynamics、performanceをversioned target packへ固定する。現行約92 ms FWHMはbaseline symptomでありtargetではない。

## 16.2 Calibration hierarchy

```text
Level 0: target / claim freeze
Level 1: activation timing + prescribed Ca waveform
Level 2: Land source cell/tissue protocols
Level 2.5: prescribed-shortening transfer
Level 3: low/normal/high-afterload minimal chamber joint-feasibility test
Level 4: homogenization + selected production mechanics + passive/generalized force
Level 5: closed loop
Level 6: pathology/intervention recipes
```

各level後に下位targetを再実行する。

## 16.3 Level 1 — activation and prescribed Ca

fit対象:

- activation delay / event timing
- diastolic Ca、peak、rise、decay
- cycle-length dependence knots

固定:

- Land parameters
- geometry
- circulation

## 16.4 Level 2 — Land source model

Caとstrain trajectoryを外部入力として固定し、force–Ca、twitch、length-step、force–velocity等へ合わせる。原著source setを変更する場合は派生IDを発行する。

## 16.5 Level 2.5 — prescribed-shortening transfer

同じCa＋Land setへ複数のstrain trajectoryを与え、shortening deactivation、shape、power、state conservationを評価する。generalized-force mapperは使わない。

## 16.6 Level 3 — minimal loaded joint feasibility

固定:

- Land kinetics
- prescribed Ca major timing
- source stress convention
- fixed early thick-sphere anatomy
- documented identityまたは事前固定homogenization
- simple afterload family

protocol:

```text
low afterload
normal afterload
high afterload
isotonic / afterload-clamp controls
```

禁止:

- free geometry/pressure gain
- dynamic valve / qDot clamp / TBV projection
- arbitrary tension filter
- morphologyだけに合わせるviscosity

単一FWHMではなく、cell/tissue targets、複数loaded shape、peak pressure、SV、work、strain domainのjoint scoreでfeasible regionを判定する。

## 16.7 Level 4 — production mechanics

Phase 4 owner decisionで選んだmechanics backendに対し、homogenization、wall mass、sarcomere anchor、passive material、generalized-force mapを独立dataで拘束する。source Land parameterは原則固定する。

## 16.8 Level 5 — closed loop

最後にvascular/valve/filling parametersを調整する。valve lossをTrefで、venous return不足をCa amplitudeで、qDot eventをmyofilament parameterで隠さない。

## 16.9 Cross-level back-check

```text
cell protocol
→ isometric twitch
→ prescribed shortening
→ minimal loaded afterload family
→ production single chamber
→ closed loop
```

同一parameter/provenanceでshape、amplitude、strain、source→wall stress変換を比較する。

## 16.10 Identifiability

最低限:

- scaled sensitivity / correlation
- singular values / numerical rank
- column cosine / condition number
- multi-start
- profile likelihood
- residual decomposition by target group

監査対象:

\[
T_{ref}\times f_{hom}\times V_{w0}\times\frac{\partial E_f}{\partial q}
\]

rank deficiencyはparameter追加で隠さず、固定、reparameterization、またはmechanics family見直しで解決する。

# 17. Verification hierarchy

## 17.1 Tier A — contracts/equations

- ActivationEvent consistency
- state layout/path/hash
- Land residual/Jacobian
- discrete strain-rate consistency
- algorithmic tangent with re-solve
- source→wall homogenization
- generalized-force units and virtual power
- deterministic initialization/replay

## 17.2 Tier B — Land source protocols

force–Ca、length dependence、isometric twitch、length step、force–velocity、conservation、dt convergenceをversioned fixturesで検証する。

## 17.3 Tier C1 — prescribed Ca + Land isometric

- time to peak、FWHM、width80/90
- relaxation tau/R²
- dT/dt
- peak/mean ratio

LVP targetをcell tensionへ流用しない。

## 17.4 Tier C2 — prescribed-shortening replay

low/physiologic/high shortening、lengthening、constant-velocity controlsを同一setで実行する。rateはtrajectory/timeからconsistentに導出する。

## 17.5 Tier D0 — minimal loaded afterload family

構成:

- early thick-sphere
- fixed homogenization
- two-element afterload at low/normal/high levels
- no dynamic valve、qDot clamp、TBV projection、septal/pericardial coupling

readouts:

- loaded pressure morphology
- peak pressure、SV、work
- shortening history
- source and wall stress
- generalized-force/virtual-power residual

## 17.6 Tier D1 — production single-chamber mechanics

owner-selected mechanics backendでisovolumic、preload、afterload clamp、isotonic、work-loop、passive filling、length perturbationを行う。

## 17.7 Tier E — solver comparison

local monolithicとproduction partitionedをHR、preload、afterload、Ca、dt matrixで比較する。coordinate vector、Land state、generalized force、phase errorを含める。

## 17.8 Tier F — closed loop

- Normal、HR100/re-arm
- preload/TBV、afterload、PVR
- hemorrhage/fluid
- global HFrEF-like、HFpEF-like
- valve/pericardial sanity

Phase 6はLV/RV Land＋clean atrial elastance bridgeとする。

## 17.9 Tier G — low-preload bifurcation

- dt refinement
- local reference agreement
- event/clamp crossing classification
- signed return map
- worst-delta clean coverage
- root-fix claim時のfull-state confirmation

## 17.10 Tier H — claim boundary

Prescribed-Ca versionのofficial casesに、SR load、RyR、SERCA等のmechanistic labelがないことをschema/testで検証する。

## 17.11 Tier I — performance

reference hardware上でmedian/p95、first-sample latency、allocation、Newton/substep、main-thread tasksを測る。

# 18. Acceptance gates

## 18.1 Common gate

implementation、tests、artifact、source/provenance、target IDs、failure cases、CI command、必要なowner decisionを揃える。

## 18.2 Target/claim freeze gate

- cell/intact target
- prescribed trajectories
- loaded morphology measurement
- low/normal/high afterload family
- baseline artifact
- performance hardware
- prescribed-Ca claim boundary

をcandidate結果前に固定する。

## 18.3 Land source gate

- finite/conservation/positivity
- no production projection
- force–Ca、length-step、force–velocity、twitch pass
- dt convergence
- algorithmic tangent re-solved FD pass

## 18.4 Early Land-first gate

### GO

- 同一admissible setでcell/tissue、prescribed shortening、複数afterload loaded protocolにfeasible regionがある。
- morphology改善がSV/pressure/ejection suppressionやfree gainによらない。
- source protocol、Ca domain、strain domainを壊さない。

### REVISE

- 単一protocolは外れるが、discrepancy sourceをactivation/Ca/Land/afterload/kinematicsに分離できる。
- 追加spikeと終了条件をownerが承認する。

### NO-GO

- 事前登録domain内でjoint feasible regionが存在しない。
- 改善にsource protocol破壊、非現実的Ca、hidden gain、output suppressionが必要。

## 18.5 Homogenization/mechanics/identifiability gate

- source stressとwall stressのboundaryが明示。
- generalized-coordinate virtual power pass。
- owner-selected mechanics backendがdocumented。
- free parameter Jacobianがpolicy上full rank。
- multi-start/profile likelihoodで実用的に識別可能。

## 18.6 Production single-chamber gate

- passive energy / multi-coordinate virtual-power pass
- coordinate contributionsの和がtotalと一致
- reference vs production solver within tolerance
- D0のshape improvementを保持
- anatomy/strain domain内

## 18.7 Closed-loop gate

- Normal/HR/preload/afterload periodic steady
- TBV/LV-RV balance
- loaded morphology target
- stage-to-stage transfer report
- qDot/valve contamination classification
- prescribed-Ca claim boundary遵守

## 18.8 Performance gate

承認済みbudgetを満たし、toleranceやphysiology gateを黙って緩めない。

## 18.9 Release gate

- legacy active-stress runtime削除
- old snapshot/case explicit rejection
- official cases再authoring
- provenance/limitations表示
- owner decisions accepted
- companion normative docsとdesign recordが同期
- final atrial configuration明示

# 19. 実装PhaseとPR分割

## Phase 0 — ADR、document split、target/claim freeze

成果物:

```text
docs/myocardium/adr/ADR-MYO-001.md
docs/myocardium/model-spec/myocardium-land-v1.md
docs/myocardium/verification/myocardium-v1-verification.md
docs/myocardium/roadmap/myocardium-rebuild-roadmap.md
docs/myocardium/research/myocardial-contraction-rebuild-design-record.md
data/myocardium/sources.json
data/myocardium/targets/*
```

owner sign-off:

- stress/strain convention
- ActivationEvent contract
- prescribed-Ca claim boundary
- morphology measurement
- early kill rule

## Phase 1 — contracts、state registry、standalone Land

### PR 1A — activation/state/contracts

- canonical ActivationEvent
- hierarchical ModelInstancePath
- state layout/hash
- units/provenance
- no ModelCore connection

### PR 1B — Land source equations

- immutable source parameter sets
- residual/Jacobian
- source output semantics

### PR 1C — Land protocol closure

- cell/tissue fixtures
- stabilization coefficient
- discrete algorithmic tangent
- dt/failure reporting

## Phase 2 — PrescribedCalciumTransient and transfer

### PR 2A — prescribed calcium

- renamed backend
- ActivationEvent input
- knot table
- claim-boundary tests

### PR 2B — isometric Ca + Land

### PR 2C — prescribed shortening

- consistent rate derivation
- morphology transfer
- no pressure/valve/qDot

## Phase 3 — early thick-sphere loaded spike

### PR 3A — fixed early kinematics

### PR 3B — identity/fixed homogenization + single-coordinate generalized force

### PR 3C — low/normal/high afterload family

### Phase 3 owner gate

`GO / REVISE / NO-GO`。GOなしでPhase 4へ進まない。

## Phase 4 — production mechanics selection and integration

### PR 4A — production ventricular mechanics decision dossier

比較:

```text
thick-sphere-v2
TriSeg-lite candidate
full TriSeg-compatible candidate when justified
```

比較項目はscientific scope、validation data、rank、virtual power、performance。

### PR 4B — tissue homogenization

- source→wall adapter
- independent parameter sources
- identifiability

### PR 4C — passive energy + generalized-force mapper

- multi-coordinate contract
- active/passive/viscous contribution tests

### PR 4D — selected production mechanics calibration

## Phase 5 — stable local coupling and performance

- local monolithic BE
- SDIRK2 reference
- active-stiffness partitioned
- performance smoke
- ModelCore registry integration

## Phase 6 — LV/RV closed loop with temporary atrial bridge

```text
LV/RV: new Land-based myocardium
LA/RA: clean atrial elastance bridge
```

- closed-loop validation
- morphology transfer
- qDot/valve controls
- claim-boundary validation

## Phase 7 — atrial research phase

human atrial data、activation timing、AV-plane、reservoir/conduit/boosterを専用に扱う。LV parameter縮小コピーは禁止する。

## Phase 8 — legacy removal and case re-authoring

- ActiveStressChamberModel、fixed 5-state slots、old knob resolver削除
- old state/case explicit rejection
- mechanism/claim-aware official case再authoring

## Phase 9 — optional extensions, each requiring a separate ADR

```text
BCS adapter/backend
ConservativeCalciumCyclingV1
TriSeg upgrade when not selected in Phase 4
MultiPatch/regional heterogeneity
regional activation / pacing / dyssynchrony
RDQ20 research backend
```

これらを一つのPhaseとしてまとめて実装しない。

# 20. 既存ファイル別変更マップ

## `engine/chambers.ts`

- Land equationsを置かない。
- elastance control/atrial bridgeを別ファイルへ分離。
- legacy active-stress codeを最終削除。

## `engine/core/stateLayout.ts`

- fixed `{c,a,r,tensionPa,lambdaAct}` slotsを削除。
- hierarchical instance registry-driven layoutへ変更。
- path、block version、labelsをhashへ含める。

## `engine/ModelCore.ts`

- `myocardialUnits` とexplicit atrial bridgeへ置換。
- activation eventsをschedulerから配布。
- generalized forcesをcoordinate ownerへ戻す。
- local solver/virtual-power healthを収集。

## `engine/protocol.ts`

- legacy `HeartModelMode`とscale fieldsを廃止。
- typed myocardium instance specs、claim level、solver/provenanceを追加。

## `engine/core/params.ts` / `engine/knobs.ts`

- legacy scale knobs削除。
- prescribed Ca、myofilament、passive、viable fractionのversioned recipeへ変更。
- SERCA/RyR等のrecipeは保存型Ca backendなしに追加しない。

## `engine/stateContract.ts`

- state instance path、block metadata、model IDs、target/claim/temperatureをserialize。
- old snapshotを明示拒否。

## Existing low-preload tools

- pressure morphology、qDot、event diagnosticsを保持。
- legacy `c/a/Kd/fIso/gOver/lambdaAct`を新diagnosticsへ置換。
- source stress、wall stress、generalized forces、activation event、solver residualを追加。

## New files

```text
engine/myocardium/activation/*
engine/myocardium/state/*
engine/myocardium/calcium/*
engine/myocardium/myofilament/land2017/*
engine/myocardium/homogenization/*
engine/myocardium/kinematics/*
engine/myocardium/material/*
engine/myocardium/generalizedForce/*
engine/myocardium/ventricularMechanics/*
engine/myocardium/coupling/*
engine/chambers/atrialElastanceBridge.ts
tools/myocardium/*
```

# 21. Suggested package scripts

```json
{
  "scripts": {
    "verify:myocardium-contracts": "vite-node tools/myocardium/verifyContracts.ts",
    "verify:land-protocols": "vite-node tools/myocardium/verifyLandProtocols.ts",
    "verify:prescribed-calcium": "vite-node tools/myocardium/verifyPrescribedCalcium.ts",
    "verify:prescribed-shortening": "vite-node tools/myocardium/verifyPrescribedShortening.ts",
    "verify:minimal-loaded-chamber": "vite-node tools/myocardium/verifyMinimalLoadedChamber.ts",
    "verify:generalized-forces": "vite-node tools/myocardium/verifyGeneralizedForces.ts",
    "verify:single-chamber": "vite-node tools/myocardium/verifySingleChamber.ts",
    "verify:myocardial-coupling": "vite-node tools/myocardium/compareCouplingSolvers.ts",
    "verify:morphology-transfer": "vite-node tools/myocardium/reportMorphologyTransfer.ts",
    "verify:claim-boundary": "vite-node tools/myocardium/verifyClaimBoundary.ts",
    "benchmark:myocardium-runtime": "vite-node tools/myocardium/benchmarkRuntime.ts",
    "report:myocardial-identifiability": "vite-node tools/myocardium/identifiabilityReport.ts"
  }
}
```

CI:

```text
fast PR: contracts + selected Land/Ca tests
hypothesis PR: isometric + prescribed shortening + afterload family
mechanics PR: generalized force + rank + single chamber
nightly: closed-loop + bifurcation + performance + claim-boundary
```

Phase 3 gate artifactにはparameter/provenance、joint-feasibility summary、morphology transfer、commandsを含める。

# 22. Data and fixture governance

## 22.1 Directory layout

```text
data/myocardium/
├── sources.json
├── activation/
├── land2017/
│   ├── raw/
│   ├── digitized/
│   ├── processed/
│   └── README.md
├── prescribed-calcium/
├── homogenization/
├── morphology/
├── geometry/
├── mechanics-comparison/
├── performance/
└── policies/
```

## 22.2 Source registry

各sourceは次を必須とする。

```text
id
fullTitle
authors
journalOrRepository
year
volumeIssuePages
doiOrPersistentId
versionUsed
licenseOrRedistributionNote
usedForEquations
usedForParameters
usedForTargets
verifiedBy
verifiedAt
```

不完全な略記、PMIDだけ、曖昧な「2019 work」をnormative sourceにしてはならない。完全書誌を確定できないsourceは `bibliographyStatus: unresolved` とし、equation/parameter実装へ使用しない。

## 22.3 Parameter / target files

parameterにはsource variant、units、parent、patch、sha256を持たせる。targetにはpopulation、measurement definition、fit/validation/holdout/sanity roleを持たせる。

## 22.4 Morphology measurement

beat selection、baseline subtraction、normalization、threshold interpolation、multi-peak、smoothing、sampling、relaxation fitを固定し、current baselineとhuman targetに同じcodeを使う。

## 22.5 Target freeze and licensing

candidate結果を見てtargetをin-place変更しない。論文図digitizationは手順、担当、再配布可否を記録する。

# 23. Risk register

| Risk | 兆候 | Mitigation / gate |
|---|---|---|
| Landがloaded morphologyを解決しない | cell passだが複数loaded protocolでjoint feasible regionなし | C2/D0 owner gate、NO-GO |
| scope creep to full-heart platform | Phase 1前にTriSeg/ionic/MultiPatch実装開始 | Non-goals、separate ADR |
| Activation/Ca input inconsistency | HR、phase、eventが不一致 | canonical ActivationEvent、duplicate input禁止 |
| prescribed Caをcycling modelと誤称 | SERCA/RyR等のofficial claim | naming/claim-boundary schema test |
| Land transcription error | protocol一部不一致 | equation mapping、independent review、FD Jacobian |
| source stressとwall stress混同 | Tref/geometryで圧を自由調整 | explicit homogenization adapter、source registry |
| homogenizationがhidden gain化 | active fraction/orientationがPV fitだけで決まる | independent data、rank/profile gate |
| strain/rate離散不整合 | tangent testがcaller依存 | DiscreteKinematicsAdapter、single source of rate |
| scalar mapperでseptal/AV powerが欠落 | pressureは合うがenergy residual | generalized coordinates/forces |
| geometry–stress積縮退 | stress/strainが非現実的 | rank、wall/strain data、mechanics comparison |
| TriSegを早期必須化して仮説が混ざる | Land効果とgeometry効果が分離不能 | Phase 3 fixed thick-sphere、Phase 4 decision |
| thick-sphereを無検証でproduction固定 | RV/septal casesが説明不能 | production mechanics owner decision |
| patch-ready schemaがruntime scope creepを誘発 | 空のMultiPatch abstractionが増える | schema only、runtimeはseparate ADR |
| Ca–kinetics同時fit非同定 | 多解・強相関 | hierarchy、holdout、profile |
| partitioned instability | dt依存振動 | local reference、active stiffness |
| qDot clampが改善を偽装 | FWHM改善とclamp増加 | qDot/event controls |
| waveform flatteningが改善を偽装 | peak/SV/ejection低下 | composite output gate |
| atrial data scarcity | LV scaleコピー | research phase、hybrid limitation |
| reference bibliography不完全 | equation sourceが追跡不能 | source registry merge gate |
| performance regression | 正しいが教材で遅い | Phase 5 benchmark、Worker |
| temperature scope creep | Q10なしで低体温 | fixed 310.15 K、separate ADR |

# 24. Model limitations表示

初期版では次をUI/provenanceへ表示可能にする。

- representative/global myocardial unitsであり、regional runtimeではない。
- spatial electrical propagationを解かない。
- Activation Schedulerはelectrophysiology modelではない。
- `PrescribedCalciumTransientV1` は保存型Ca cyclingではない。
- SERCA、RyR、SR load、Ca alternansを機序的に表現しない。
- source Land stressからwall stressへのhomogenization仮定を持つ。
- production ventricular mechanics backendとその適用範囲を表示する。
- thick-sphere版ではseptal bowing/ventricular interactionの限界がある。
- temperatureは310.15 K固定。
- population-level parameter setでありpatient-specificではない。
- Phase 6のLA/RAはtemporary elastance bridge。
- clinical decision supportではなく教育・研究モデルである。

# 25. Definition of Done

## Scientific

- Land source protocolsがversioned targetに合格。
- activation、prescribed Ca、Land、homogenization、mechanicsの責務が分離。
- prescribed shorteningと複数afterload loaded protocolにjoint feasible regionがある。
- loaded morphology targetを、SV/peak/ejection/clamp artifactなしに通過。
- source stress→wall stress→generalized forceの仮定とprovenanceが明示。
- selected production mechanics backendの適用範囲とlimitationsが明示。
- prescribed-Ca版がSR/RyR/SERCAをmechanisticに主張しない。

## Numerical

- BE/2次local referenceとproduction couplingが存在。
- strain/rate consistency、stabilization、algorithmic tangentを検証。
- multi-coordinate virtual-power test pass。
- silent clamp/projectionなし。

## Closed loop

- normal/HR/preload/afterload、TBV/LV-RV balance、morphology pass。
- qDot/valve event contaminationを分類。
- atrial configurationが明示。

## Performance

- approved realtime budgetを満たし、main threadをblockしない。

## Software/governance

- hierarchical patch-ready state layout。
- model/parameter/solver/target/claim/temperature provenance。
- legacy runtime/state/caseをsilent migrationしない。
- official casesをclaim-aware recipeで再authoring。
- ADR、model spec、verification plan、roadmap、design recordが同期。
- source registryの完全書誌がmerge gateを通る。

# 26. Open decisions requiring model-team sign-off

本節の推奨はowner判断用baselineである。

## 26.1 Decision summary

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

## 26.2 Recommended decisions

### Decision 1 — Land variant

`land2017-intact-human-37c-source-v1`から開始し、source setをimmutableに保つ。

### Decision 2 — source stress convention

Land `T_a`をengineering strainに共役なfiber nominal/first-Piola scalar stressと解釈する。

### Decision 3 — strain coordinate

\[
E_f=L_s/L_{s,0}-1
\]

### Decision 4 — homogenization

source Land outputをwall stressへ直結せず、active tissue fractionとorientation ruleを持つadapterを使う。初期値は固定/独立拘束し、PV loopだけでfitしない。

### Decision 5 — sarcomere anchor

`Ls0`はsource固定、`Ls,anchor`と`Vanchor`は独立data/狭いprior。rankが不足する場合は自由度を減らす。

### Decision 6 — passive law

旧parameterを移植せず、engineering strainに対するconvex exponential energy family。

### Decision 7 — integrator

BE bring-up、SDIRK2 release reference、productionはaccuracy/performanceで選ぶ。

### Decision 8 — tangent semantics

`stabilizationStiffnessPa`、`algorithmicTangentPa`、`frozenStateTangentPa`を別fieldにする。

### Decision 9 — ActivationEvent

`activationEventId`、`timeSinceActivationSec`、`cycleLengthSec`をsingle source of truthとし、HR/phase/event flagを重複させない。

### Decision 10 — prescribed Ca

Land paired target＋human experimental target、cycle-length knot table。backend名は `PrescribedCalciumTransientV1`。

### Decision 11 — Ca claim boundary

保存型Ca backendなしにSERCA/RyR/SR-loadをofficial mechanistic interventionとして出さない。

### Decision 12 — closed-loop targets

anatomy、hemodynamics、morphology、dynamic responseを分け、fit/validation/holdout/sanity roleを持たせる。

### Decision 13 — atrial progression

ventricular scientific/numerical/performance/identifiability gateとatrial data policy承認後。

### Decision 14 — morphology

FWHM単独でなくwidth、time-to-peak、relaxation、ejection、dP/dt、pressure-flow phase、peak/SV/COを一つのpackで扱う。

### Decision 15 — early kill

cell/tissue＋prescribed shortening＋複数loaded protocolのjoint feasible regionで判断する。

### Decision 16 — performance

暫定 `>=10x realtime`、`60 s <= 6 wall s`、first sample `<=150 ms`、no main-thread simulation。

### Decision 17 — temperature

`fixed-310.15K-v1`。低体温はQ10等を含む別ADR。

### Decision 18 — first release atria

推奨案AはLand LV/RV＋clean atrial elastance bridge。hybrid limitationをUI/provenanceへ表示する。

### Decision 19 — production ventricular mechanics

Phase 3 spikeではthick-sphereを固定利用する。Phase 4前にofficial case scope、data、rank、virtual-power、performanceからA/B/Cを選ぶ。TriSegを自動的な必須条件にしない。

### Decision 20 — regional runtime

state schemaはwall/region/patch-readyとするが、MultiPatch runtime、regional activation、AMI/LBBB/CRTは別ADRまで初期scopeへ含めない。

# 27. ADR-MYO-001 draft

```text
Title: Full replacement of the myocardial contraction subsystem — Phase A
Status: Proposed

Decision:
1. Replace, rather than patch, the legacy ActiveStressChamberModel.
2. Separate rhythm/activation scheduling from calcium transient generation.
3. Use PrescribedCalciumTransientV1 and Land 2017 intact-human as the first
   falsifiable kernel; do not call the prescribed transient a calcium-cycling model.
4. Separate Land source active fiber stress from wall-level homogenized stress.
5. Use engineering fiber strain and a nominal/first-Piola scalar source stress,
   pending owner sign-off.
6. Use hierarchical state-instance paths that are patch-ready without implementing
   MultiPatch runtime in Phase A.
7. Map wall stress to all generalized-coordinate conjugate forces through virtual
   power; cavity pressure is only the volume-coordinate case.
8. Derive strain rate consistently from the discrete integration scheme for all
   implicit residuals and tangent tests.
9. Maintain local monolithic reference solvers and a stabilized production
   partitioned solver.
10. Run the early sequence: cell/tissue protocols, prescribed shortening, and a
    low/normal/high-afterload minimal chamber family. Require owner GO before
    production mechanics integration.
11. Use thick-sphere-v2 for the early spike. Select the production ventricular
    mechanics backend before Phase 4; TriSeg is an option, not an automatic mandate.
12. Keep qDot/valve defaults unchanged during structural replacement, while retaining
    them as mandatory confounder diagnostics.
13. Use a temporary clean atrial elastance bridge during ventricular integration.
14. Do not claim SERCA, RyR, SR-load, or calcium-inventory mechanisms until a
    conservative calcium-cycling backend is separately implemented and validated.
15. Do not include full ionic ECC, RDQ20 runtime, monodomain, or regional MultiPatch
    runtime in Phase A.
16. Reject legacy states, snapshots, raw parameter patches, and knob mappings.
17. Re-author official cases with mechanism- and claim-aware recipes.
18. Split normative ADR, model spec, verification plan, and roadmap from the long
    design record.

Consequences:
- All baseline calibration and official snapshots are invalidated.
- State and parameter schemas change incompatibly.
- Land may be rejected before production integration.
- A geometry-independent generalized-force contract increases upfront work but avoids
  another schema break when septal/AV-plane/TriSeg coordinates are added.
- A first release may be a documented hybrid with Land ventricles and atrial elastance.
- Conservative Ca, TriSeg, BCS, MultiPatch, and regional activation remain separately
  gated extensions.
```

# 28. References and source registry

`data/myocardium/sources.json` をbibliographyと実装来歴のsource of truthとする。各entryは、完全title、全authors、venue/repository、year、volume/issue/pages、DOIまたはpersistent ID、使用版、verification status、実装上のroleを持つ。

**規範:** `verificationStatus != "verified"` のsourceを、方程式転記、parameter fixture、target pack、またはacceptance thresholdの根拠へ使用してはならない。略記、PMIDだけ、二次引用だけのsourceは、完全書誌と使用箇所を確定するまで実装sourceから除外する。

## 28.1 Phase A normative sources

1. Land S, Park-Holohan SJ, Smith NP, dos Remedios CG, Kentish JC, Niederer SA. **A model of cardiac contraction based on novel measurements of tension development in human cardiomyocytes.** *Journal of Molecular and Cellular Cardiology*. 2017;106:68–83. DOI: `10.1016/j.yjmcc.2017.03.008`.  
   **Role:** Land equations、source parameter variants、cell/tissue protocol definitions.

2. Regazzoni F, Quarteroni A. **An oscillation-free fully partitioned scheme for the numerical modeling of cardiac active mechanics.** arXiv:`2007.15714`, 2020.  
   **Role:** stabilization coefficient、partitioned coupling、monolithic/reference comparison.

3. Regazzoni F, Salvador M, Africa PC, Fedele M, Dedè L, Quarteroni A. **A cardiac electromechanical model coupled with a lumped-parameter model for closed-loop blood circulation.** *Journal of Computational Physics*. 2022;457:111083. DOI: `10.1016/j.jcp.2022.111083`.  
   **Role:** closed-loop energy accounting、model-layer separation、reference configuration and coupling context.

## 28.2 Verified comparison and future-backend sources

4. Marchesseau S, Delingette H, Sermesant M, Sorine M, Rhode K, Duckett SG, Rinaldi CA, Razavi R, Ayache N. **Preliminary Specificity Study of the Bestel-Clément-Sorine Electromechanical Model of the Heart using Parameter Calibration from Medical Images.** *Journal of the Mechanical Behavior of Biomedical Materials*. 2013;20:259–271. DOI: `10.1016/j.jmbbm.2012.11.021`.  
   **Role:** future BCS comparison、organ-level calibration and identifiability context. It is not a Phase A Land equation source.

5. Caruel M, Chabiniok R, Moireau P, Lecarpentier Y, Chapelle D. **Dimensional reductions of a cardiac model for effective validation and calibration.** *Biomechanics and Modeling in Mechanobiology*. 2014;13(4):897–914. DOI: `10.1007/s10237-013-0544-6`.  
   **Role:** model reduction、validation/calibration methodology、cross-scale interpretation.

6. Regazzoni F, Dedè L, Quarteroni A. **Biophysically detailed mathematical models of multiscale cardiac active mechanics.** arXiv:`2004.07910`, 2020.  
   **Role:** RDQ20-MF research comparison and future high-fidelity backend evaluation. It is not a Phase A runtime dependency.

7. Chapelle D, Le Tallec P, Moireau P, Sorine M. **An energy-preserving muscle tissue model: formulation and compatible discretizations.** *International Journal for Multiscale Computational Engineering*. 2012;10(2):189–211.  
   **Role:** BCS energy structure. Before a BCS implementation PR, the exact publisher record and persistent identifier MUST be verified and locked in `sources.json`.

## 28.3 Ventricular-mechanics candidate source

8. CircAdapt Framework documentation. **TriSeg — ventricles including interaction.** Documentation version 2407.  
   **Role:** Phase 4 candidate definition and comparison criteria only. Citing this source does not adopt TriSeg automatically.

## 28.4 Explicitly excluded unresolved shorthand

Earlier discussion used the shorthand **“Caruel–Moireau–Chapelle 2019 / PMID 30607642”**. Its exact bibliographic identity and its relation to the intended equations were not established reliably during preparation of this revision. Therefore:

- it is **not** a normative reference;
- it MUST NOT appear as an equation or parameter source in `sources.json`;
- it MUST NOT be used to justify implementation choices;
- it MAY be restored only after full title、authors、venue、DOI/persistent ID、version、and exact implementation role are independently verified.

This exclusion is preferable to attaching a convincing but potentially incorrect citation to the implementation.

## 28.5 Repository baseline

9. `engine/chambers.ts`, `engine/core/stateLayout.ts`, `engine/protocol.ts`, `engine/knobs.ts`, `engine/stateContract.ts` at baseline commit `228bef96e5f522de2cfe352de5d6d4d2f017c550`.
10. historical low-preload research notes recoverable from the baseline commit at the same baseline.
11. `tools/verifyStarlingLowPreloadMatrix.ts` at the same baseline.

# Appendix A — Initial implementation checklist

```text
[ ] legacy tag created
[ ] ADR merged
[ ] owner decision log created
[ ] normative companion docs generated and linked
[ ] source registry created
[ ] all equation/parameter sources bibliography-verified
[ ] unresolved references marked non-normative
[ ] ActivationEvent contract accepted
[ ] activation scheduler is independent from Ca amplitude/kinetics
[ ] prescribed-Ca claim boundary accepted
[ ] stress measure accepted
[ ] strain coordinate accepted
[ ] source-to-wall homogenization boundary accepted
[ ] generalized-coordinate/force contract accepted
[ ] Land source variant policy accepted
[ ] morphology measurement definition frozen
[ ] current ~92 ms baseline artifact archived
[ ] human morphology target pack versioned
[ ] performance reference hardware benchmarked
[ ] model IDs fixed
[ ] units contract merged
[ ] hierarchical patch-ready state registry merged
[ ] Land equations transcribed with equation references
[ ] source parameter sets immutable
[ ] Land parameter provenance checked
[ ] Land protocol fixtures committed
[ ] stabilization/tangent semantics fixed
[ ] discrete strain/rate consistency tests passing
[ ] algorithmic tangent re-solved FD test passing
[ ] PrescribedCalciumTransientV1 implemented and validated
[ ] HR/cycle-length knot table validated
[ ] Ca/Land hierarchical fit tooling available
[ ] isometric twitch gate passing
[ ] prescribed-shortening transfer report passing
[ ] low/normal/high-afterload joint-feasibility report passing
[ ] kinematics/sarcomere bridge derivation reviewed
[ ] minimal loaded chamber spike completed
[ ] Phase 3 owner GO/REVISE/NO-GO recorded
[ ] production ventricular mechanics decision recorded
[ ] production mechanics satisfies multi-coordinate virtual-power tests
[ ] geometry/homogenization identifiability rank gate passing
[ ] passive energy law passing
[ ] local monolithic BE reference passing
[ ] local monolithic SDIRK2 reference passing
[ ] partitioned solver converges to reference
[ ] production performance gate passing
[ ] temporary atrial elastance bridge isolated
[ ] LV closed-loop matrix passing
[ ] RV closed-loop matrix passing
[ ] loaded LVP/RVP morphology target passing
[ ] morphology transfer report attached
[ ] qDot/valve confounder report attached
[ ] claim-boundary report attached
[ ] state schema broken intentionally
[ ] old loader rejects explicitly
[ ] official cases re-authored with claim-aware recipes
[ ] final atrial release policy recorded
[ ] legacy active-stress code removed
[ ] model limitations shown in result/UI
```

# Appendix B — PR review template

```markdown
## Scientific scope
- Model/equations version:
- Parameter set:
- Data/fixture provenance:
- Source-registry entries changed:
- Target pack IDs:
- Decision baseline ID:
- Which assumptions changed:
- Which assumptions did not change:

## Activation and calcium semantics
- Activation scheduler/version:
- ActivationEvent fields and event ordering:
- Calcium backend/version:
- Claim level: prescribed-transient / conservative-cycling
- Mechanisms explicitly NOT claimed:
- Cycle-length interpolation/extrapolation behavior:

## Myofilament and tissue semantics
- Land source variant:
- Source stress convention:
- Source-to-wall homogenization model:
- Fixed/constrained homogenization quantities:
- Wall active stress output:
- Passive/viscous model versions:

## Kinematics and generalized forces
- Coordinate IDs:
- Strain definition:
- Discrete strain-rate construction:
- dStrain/dCoordinate verification:
- Conjugate-force outputs:
- Virtual-power residual:
- Production ventricular mechanics backend:

## Central hypothesis
- Current gate: C1 / C2 / D0 / D1 / closed loop
- Does this PR move the joint-feasibility result toward GO, REVISE, or NO-GO?
- Is the same admissible parameter set used across levels?
- Could improvement be explained by pressure/SV/ejection suppression?

## Numerical method
- Solver/coupling:
- dt matrix:
- Reference comparison:
- Stabilization stiffness definition:
- Algorithmic tangent test:
- Failure policy:

## Validation
- Cell protocol result:
- Isometric morphology:
- Prescribed-shortening result:
- Low/normal/high-afterload result:
- Minimal loaded chamber result:
- Production single-chamber result:
- Closed-loop result:
- Morphology transfer summary:
- qDot/valve/clamp contamination:
- Claim-boundary result:
- Known failures:

## Identifiability
- Free parameters:
- Fixed parameters:
- Priors/anchors:
- Numerical rank:
- Condition/correlation result:
- Multi-start result:
- Profile likelihood result:

## Performance
- Reference hardware:
- Simulated seconds / wall second:
- First sample latency:
- Median / p95:
- Main-thread long tasks:
- Allocation / GC:

## Compatibility
- State instance-path/schema impact:
- Case impact:
- Snapshot impact:
- Silent fallback present: MUST be no

## Owner decisions
- Decision(s) required:
- Recommended option:
- Alternatives:
- Owner outcome:

## Artifacts
- JSON:
- CSV:
- plots:
- command:
```

# Appendix C — Document split and source of truth

```text
docs/myocardium/adr/ADR-MYO-001.md
    accepted decisions, scope, non-goals, consequences

docs/myocardium/model-spec/myocardium-land-v1.md
    normative equations, units, API, state and solver contracts

docs/myocardium/verification/myocardium-v1-verification.md
    targets, fixtures, tiers, GO/REVISE/NO-GO and release gates

docs/myocardium/roadmap/myocardium-rebuild-roadmap.md
    phases, PRs, dependencies, migration and ownership

docs/myocardium/research/myocardial-contraction-rebuild-design-record.md
    this detailed background and rationale

data/myocardium/sources.json
    normative bibliography and extraction provenance
```

In case of conflict:

```text
accepted ADR
> normative model spec
> verification plan
> roadmap
> design record
```
