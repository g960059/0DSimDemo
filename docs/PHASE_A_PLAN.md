# Phase A — 詳細実装計画 v2（M4 / M5 / M6）

最終更新: 2026-05-30（v2: Codex 5.5 high ＋ Claude 4.8 high の計画レビューを反映）
前提: Phase S 完了。位置づけ: [ROADMAP.md](ROADMAP.md) §4「Phase A」の実装計画。

> **v2 改訂要旨**（両レビュアーとも v1 を PLAN-NEEDS-WORK と判定。収束した指摘を反映）:
> 1. 順序を **M5 優先 / 「M4-lite → M5」** へ変更（異常ケース＝出血・蘇生が最優先のため）。
> 2. **観測量サブタスク M0bs を最初に**（Pmsf・stressed/unstressed・Pth/Palv・主要 flow・Vu・source/sink 台帳を SimMetrics へ。これが無いと M5/M6 の acceptance が検証不能）。
> 3. M4 の写像 API・contractility・**Diastolic stiffness の実装経路**を修正（active モデルは `node.active` を無視する既知quirk のため新経路が必要）。
> 4. M5 の出血/輸液を **expected-TBV 台帳 + 既存 projector** で設計し、**health は expectedTBV と比較**（出血を mass drift と誤検知しない）。venous-return の因果記述を修正。
> 5. M6 の **単位不整合（UI=cmH2O / engine=mmHg）を是正**（D10 の真因）。PEEP が SV に届かない topology を明示。
> 6. acceptance を「矢印」から**具体的な波形特徴量・閾値**へ。

---

## 0. 設計原則（Phase S 継承）

1. **形 > 値**（AoP/LVP・aortic notch・LV PV loop・MV flow E/A で判断）。
2. **異常ケースが主目的**（shock/hypertension/hypovolemia/PEEP負荷）。health は数値妥当性のみ。
3. **初学者を圧倒しない**（臨床ノブ既定、raw/fibre は opt-in）。
4. **不変条件は回帰テスト**（既定不変→S0 snapshot byte-identical、変える→意図明記＋更新）。
5. **driver は engine 側**（`ModelCore`/`chambers`/`PreviewController` 分離維持）。

---

## 1. シーケンス（改訂: M5 優先）

| 順 | 項目 | 主目的 | リスク |
|---|---|---|---|
| **A0** | **M0bs 観測量整備** | Pmsf・stressed/unstressed・Pth/Palv・Q_VC_RA・Q_PCap_PVen・venous P・Vu・source/sink を観測可能に | 低（出力追加のみ） |
| **A1** | **M5 Dynamic Vu / hemorrhage・fluid** | preload/venous return の動的化と出血・輸液（異常ケースの中核） | 中（状態拡張＋台帳） |
| **A2** | **M4-lite Clinical knobs** | M5 の preload/volume/tone ＋ contractility/stiffness を臨床ノブ面へ。raw は Advanced | 低（UI＋薄い写像） |
| **A3** | **M6 Respiratory / PEEP / 肺 waterfall** | 単位是正・PEEP伝達・呼吸変動・West-zone | 中 |

根拠: 出血・蘇生は「現状の `targetVolume` 即時再ピンでは生理的に再現不能」で価値最大 → M5 を前倒し。M4 は「M5/M6 の新ノブを正しい層に出す」最小ファサードに縮小し、広範な UI 整理は後段。M6 は M5 の静脈動態に依存（PEEP→venous return）。M0bs は全 acceptance の前提。

---

## 2. A0 = M0bs 観測量整備（最初に実施）

### Why
M5/M6 の acceptance（Pmsf↑、stressed/unstressed 再分配、West-zone、呼吸性 RAP/AoP swing）は現 `SimSample`/`SimMetrics`（protocol.ts:65–115）に出力が無く**検証不能**。両レビュアーの最重要指摘。

### Design / 追加出力
- `SimMetrics`/`SimSample` または専用 `debugObservables()` に:
  - **Pmsf**（mean systemic filling pressure）: 近似 `Pmsf ≈ (SBV_sys − Σ_sys Vu) / Σ_sys C`（または zero-flow 圧）。定義はユーザー確認（§6 Q-Pmsf）。
  - **stressed / unstressed volume**（per systemic-venous bed）: `venousStressedVolume` は内部計算済（ModelCore.ts 既存）→ emit するだけ。
  - **RAP**（既存 sample にあり）、**venous-return gradient** `(Pmsf − RAP)`。
  - **Pth, Palv**（外圧）、主要 flow **Q_VC_RA**, **Q_PCap_PVen**、venous node 圧（SV/VC/PVen/PVein）。
  - **Vu_k**（M5 後）、**sourceSinkMl / expectedTBV**（M5 後の台帳）。
- 既存の `debugValveOpenings()`/`harness` パターンに倣い read-only。

### Acceptance / Files
- `engine/protocol.ts`（型拡張）、`engine/ModelCore.ts`（出力計算）、`engine/__tests__`（Pmsf 近似が手計算と一致、stressed+unstressed = 物理体積）。
- 既定挙動・S0 snapshot 不変（出力追加は dynamics 不変）。

---

## 3. A1 = M5 Dynamic Vu / venous tone / hemorrhage・fluid

### 現状（レビューで確定）
- `effectiveVu = Vu − venousToneGain·venousTone`、応答は **SV(350)・VC(60) のみ**。
- `dVu` は smoothParams 由来の effectiveVu 変化率を `−V̇u` として pressure-state ODE に投入（`dy=(balance−dVu)/Ceff`）。
- `projectTBV` は**毎ステップ全静脈圧を一律オフセットして TBV を `initialTBV` に再ピン**（生理的 source/sink ではない）。
- **既存の TBV 変更経路**: `targetVolume`（SimInstance）→ `initializeVenousPressuresForTargetTBV` は**即時・段差**で再ピンし `initialTBV` も更新。＝出血/輸液は「時間経過なし」でしか今は出せない。

### Design（改訂）
**(a) Dynamic Vu**: SV・VC に Vu を**状態ベクトルの正式な状態**として追加（hidden mutable を避け `rhs(x)` を自己完結に）。
`V̇u_k = (Vu_k^target − Vu_k) / τ_u`、`Vu_k^target = Vu0_k − G^S_{u,k}·s_sym`（s_sym は当面静的、baroreflex M8 で動的化）。
既存 dVu 供給を Vu 状態の微分へ置換。`G^S` は現 gain（SV 350, VC 60）流用、`τ_u` 10–30 s。**static 時 `V̇u≡0` を保証**するテストで S0 不変を証明（venousTone を動かさない既定軌道は両方式で dVu=0）。
- 対象ノード: まず **SV・VC**（既に応答する2つ）。ROADMAP は SV/VC/PVein/PVen を挙げており拡張は段階的（§6 Q-Vu）。PCap は含めない。

**(b) 出血/輸液 = expected-TBV 台帳 + projector 再利用**:
- パラメータ `bleedRate`/`fluidRate`（mL/min, ≥0）。内部 `expectedTBV += (fluidRate − bleedRate)·dt`。
- 毎ステップ `projectVenousPressuresToTargetTBV(expectedTBV)` を呼ぶ（既存 bisection を verbatim 再利用、`initialTBV` の代わりに `expectedTBV`）。
- **health.massConservation を `expectedTBV` と比較**（`initialTBV` ではなく）→ **意図した出血を TBV drift と誤検知しない**（両レビュアー一致の必須点）。
- 代替案: 各静脈ノードに明示 source/sink `S_k`（仕様 `\dot V=−Dq+S`）を入れ projectTBV をオフ。より物理的だが projector との二重制御に注意。**→ §6 Q-Bleed で方式確定**。当面は台帳+projector を推奨（実装小・既存資産再利用）。

### Files
- `engine/ModelCore.ts`（Vu 状態化、dVu 供給差替、expectedTBV 台帳、health 比較先変更）、`engine/protocol.ts`（`bleedRate`/`fluidRate`）、`engine/__tests__/venous.test.ts`。

### Acceptance（形優先・operational に具体化）
- **静的 dVu=0**: 全パラメータ固定で `V̇u_k=0` → S0 snapshot byte-identical（証明テスト）。
- **Venous tone 0.2→0.5**: **Pmsf が +Δ mmHg 上昇**（目標レンジは校正で確定）、`(Pmsf−RAP)` 勾配と VR が**過渡的に↑、CO↑、RAP は新定常でより高位に落ち着く**（注: RAP 上昇は VR を *opposing* する結果であり原因ではない）。SV ノードの **stressed↑/unstressed↓**（named 再分配チェック）。
- **出血（TBV −1000 mL / 5 min）**: Pmsf 単調↓、CO↓、MAP（遅れて）↓、RAP↓、PCWP/LAP↓、PV ループ縮小（EDV・SV↓）。**baroreflex 無しなので回復しない**（uncompensated shock が教育既定、§6 Q-Reflex）。輸液で可逆。health は warning を出さない（expectedTBV 比較）。
- **MV inflow E/A**: 心房 elastance activation（chambers.ts）があるため QMV は拡張期2峰。relaxation/stiffness 変化で E/A 比が変わる。

### Risks
- 状態ベクトル拡張で `makeIndex().size`・`reset`・`sanitizeState` 整合。dVu=0 テストで既定不変を担保。
- projector の一律オフセットは非生理。台帳で「総量」は正すが分配の生理性は近似（限界として明記）。

---

## 4. A2 = M4-lite Clinical knobs

### Design（改訂: レビュー指摘を反映）
- API: **`knobsToPatch(knobs): { params: Partial<CoreRuntimeParams>; targetVolume?: number }`**（Preload=targetVolume は `CoreRuntimeParams` 外で別経路 `updateInstanceVolume` のため、params と分離して返す）。
- **Contractility** → `params.contractility`（既存・1:1）。**`lvTmaxScale`/`rvTmaxScale` は Advanced の fibre-force 修飾として温存**（臨床ノブと二重化させない）。
- **Afterload** → `systemicResistance`、**PVR** → `pulmonaryResistance`、**Venous tone** → `venousTone`、**Volume status** → `targetVolume`（"Preload" ではなく総血液量と正名）、**PEEP** → `PEEP`、**Aortic/Mitral stenosis** → `*_Amax`、**regurg** → `*_Aleak`、**Lusitropy** → `relaxation`。
- **Diastolic stiffness（新経路が必要・確定: `b_pas`）**: active LV/RV は `defaultActiveLV/RV` 固定で **`node.active` override を無視する**（S2a quirk）。よって専用パラメータ `lvStiffScale`/`rvStiffScale`（=k_stiff）を `CoreRuntimeParams` に追加し、`ActiveStressChamberModel.pressure` で **`bPas_eff = bPas · k_stiff`**（EDPVR の stiffness constant β＝指数の急峻さを動かす。`sigmaPas0`(α) は曲率を変えない縦シフトなので不採用）。**k_stiff=1 既定で S0 不変**。非線形に効くため範囲は控えめ＋必要なら log マッピング。
- UI: 臨床ノブを既定タブ、raw/fibre（Tmax/Ca/Geom/nodeOverrides）は Advanced（Ventricular Mechanics の opt-in 化を踏襲）。

### Acceptance
- 写像の単体テスト（各ノブ→内部パラメータが期待方向・範囲）。`knobsToPatch` 逆写像で UI 初期値。
- **Contractility↑**: ESP↑・ESPVR 傾き↑方向、PV ループ左上シフト。
- **Afterload↑**: AoP systolic↑・SV↓・ESV 右シフト、**aortic notch 保持**。
- **Diastolic stiffness↑（k_stiff）**: EDPVR 傾き（ΔLVEDP/ΔEDV）↑、固定 EDV で LVEDP↑、**ESPVR 不変**。
- 初期表示は臨床ノブのみ。S0 snapshot 不変（既定ノブ＝現行既定）。

---

## 5. A3 = M6 Respiratory / PEEP / 肺 waterfall

### 現状（レビューで確定）
- `Pth = Pth0 + 0.20·PEEP + respAmpTh·sin`、`Palv = PEEP + respAmpAlv·sin`。resp amp 既定0。
- **UI は cmH2O 表記だが engine は mmHg 加算**（Controls.tsx:268–272 で `unit="cmH2O"`）→ 単位不整合。`0.20` 係数は実は欠落した単位換算を部分的に補っている。
- Pth が届くのは **VC/PA/PArt/PVen/PVein/RA・心室(Pperi)**。**SV（最大の体静脈容量）には届かない** → PEEP→venous return が弱い/topology 依存。

### Design（改訂）
- **(1) 単位是正（D10 の真因）**: 入力は cmH2O のまま、engine 内で `*_mmHg = *_cmH2O · 0.73556` に変換してから使用。
  `Pth = Pth0_mmHg + f_PEEP · PEEP_mmHg + respAmpTh_mmHg·sin(2πf t)`、`Palv = PEEP_mmHg + respAmpAlv_mmHg·sin(...)`。
- **(2) f_PEEP**: 胸壁/肺コンプライアンス比で `f_PEEP = C_lung/(C_lung+C_cw)`、既定 ≈0.5（Advanced 公開）。`0.20` マジック係数を置換。
- **(3) PEEP→venous return（確定: Pth を SV に直接載せない）**: PEEP→VR↓ は既に topology で存在（SV 胸腔外 vs VC/RA 胸腔内 → SV→VC 勾配縮小）。**まず A0 で実測**。不足時のみ、pleural ではなく独立の **P_abd（腹腔圧, PEEP の関数）**を splanchnic/SV に載せる（効果は Pmsf↑＝VR を一部相殺、後段・任意）。
- **(4) 肺 waterfall / West-zone**: `PCap_PVen`（ext=palv）で `useChiResistance` on のとき、`Palv > PVen 圧` で flow が Palv 律速（Zone II）になることを確認（下流 PVen 非感受 / 上流感受の assert）。
- 呼吸は**既定オフ維持**（snapshot 安定）。陽圧/自発は位相で表現。

### Files
- `engine/ModelCore.ts`（単位換算・f_PEEP・Pth 結合）、`engine/protocol.ts`（換気モード・f_PEEP・C比）、`engine/__tests__/respiration.test.ts`。

### Acceptance（operational）
- **単位**: PEEP=10 cmH2O が内部 7.36 mmHg として作用（換算テスト）。
- **PEEP 0→15 cmH2O**: RAP が +Δ mmHg、CO −X%（f_PEEP・SV結合の決定に依存。目標値は §6 Q で確定）。
- **自発呼吸**: 吸気で Pth↓→venous return↑・RAP↓、AoP に吸気性低下（pulsus-paradoxus 方向、systolic 吸気↓ ≥ 目標 mmHg）。陽圧で逆位相。
- **West-zone**: Zone II で PCap_PVen flow が下流圧に非感受。
- 既定（PEEP=0・呼吸オフ）で snapshot 不変。

---

## 6. 確定事項（2026-05-30、ドメイン専門家回答済み）

- ✅ **Q-Bleed**: **expectedTBV 台帳 + 既存 projector** で確定（projector の一律ΔP は compliance 加重の体積引抜＝静脈リザーバ優先の出血を近似。限界＝部位非特異は明示）。
- ✅ **Q-Pmsf**: **教科書近似 `(TBV−Vu)/C`** で確定。対象は systemic 血管（Ao/SA/Art/Cap/SV/VC、心腔除外）、compliance は状態依存の有効値（静脈3相 C(P)・動脈 Vs/(P0+Ptm)）。
- ✅ **Q-Vu**: **SV・VC で開始**、gain 現行流用、`τ_u` 10–30 s で確定（venousTone 変化に ~20s の生理的遅れが出る点を UX 周知）。PVein/PVen は後段拡張。
- ✅ **Q-Reflex**: **baroreflex 無し（uncompensated shock・回復しない）** で確定。出血時 MAP 低下が実患者初期代償より過敏に見えるため **「自律神経代償なし」ラベルを付す**。
- ✅ **Q-Stiff**: **`b_pas`（`k_stiff` で乗算）** で確定。理由＝臨床「拡張期スティフネス」は EDPVR の stiffness constant β＝指数の急峻さ＝`b_pas`。`sigmaPas0`(α) は曲率を変えない縦シフトで非特異。非線形性に配慮し範囲は控えめ＋必要なら log マッピング。
- ✅ **Q-PEEPSV**: **Pth を SV に直接載せない**で確定。理由＝SV は胸腔外で pleural 圧を受けない。PEEP→VR↓ は既に topology（SV 胸腔外 vs VC/RA 胸腔内）で存在。**まず A0 で現状効果を実測**し、必要時のみ別途 **P_abd（腹腔圧）**を splanchnic/SV に載せる（効果は VR を *相殺*＝Pmsf↑、後段・任意）。Pth 直載せはしない。
- 🟡 **Q-Shape**（継続）: 各 milestone の波形合否チェックリストは実装時の波形を見ながら随時合意。

## 7. 横断
- 各 milestone: 回帰テスト＋**operational な波形 acceptance**＋2者レビューゲート（1/2・改善案込み）。
- 既定不変→S0 byte-identical、変更→理由明記＋snapshot 更新＋Chrome 波形確認。
- 新パラメータは Clinical/Advanced の適切な層。health は数値妥当性のみ。
- debt 返済: M6 で D10（単位/0.20係数）、M5 で動的 Vu（仕様§17）。M4 で S2a quirk（active node.active 無視）を stiffness 用に部分解消。
