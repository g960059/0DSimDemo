# 循環動態シミュレーター：数理モデル改訂ロードマップ

最終更新: 2026-05-30
対象: Web app リアルタイムプレビュー、および将来の Mac app / 高精度 solver / 教育用 physiology studio
位置づけ: `circulatory_model_upgrade_plan_ja.md`（2026-05-29）を、実コードの現状と突き合わせて改訂したもの。元計画のロードマップ（M0–M13）・acceptance criteria・禁止事項は妥当なため踏襲し、(1) M0–M3 を「定義充足まで仕上げる」を最優先に差し込み、(2) calibration の最小版を active-stress 統合と並走させる、という2点を加えた版。

> このファイルが数理モデル開発の single source of truth。各 PR は該当マイルストーンの acceptance criteria（§6）を満たすこと。

---

## 1. この改訂の要旨

元計画は方向性・粒度ともに優れている。ただし「現在地点」の自己認識が実コードより楽観的で、M0–M3 を「着手済み / 完了」前提に置いたまま M2（active-stress）を既定モデルへ昇格させている。実コードを検証した結果、以下の乖離があった。

- **M0**（baseline freeze）: 比較スナップショット・ハーネスが存在しない → 実質未着手。
- **M1**（health checks）: `health()` は実装済みだが UI 未接続。`Model limitation` 表示も無い。
- **M2**（active-stress）: 動作するが、計画が指定した `ChamberModel` plugin 構造ではなく `heartModel` 文字列の switch でハードコード。さらに **未校正**（`lvTmaxScale=4.5` の魔法定数 + 仕様外の `f_iso` 即席項）。
- **M3**（preview hardening）: sim core がメインスレッドの React component 内で動作 → 計画自身の禁止事項 #1 に違反。

したがって本改訂では、**新機能（M4 以降）より先に M0–M3 を定義充足させ、同時に calibration 最小版で fudge factor を退治する**ことを最優先 Phase とする。

---

## 2. 現在地点（実コード ground-truth）

凡例: ✅ 完了 / 🟡 部分実装 / ❌ 未着手 / ⛔ 設計逸脱

| Phase | 名前 | 元計画の主張 | 実コード実態 | 判定 |
|---:|---|---|---|:---:|
| M0 | Baseline freeze | 完了/即時 | snapshot・Python↔TS 比較ハーネス・テスト 0 件 | ❌ |
| M1 | Core stabilization | 最優先 | `health()`/`metrics()` 実装済（`engine/ModelCore.ts:456,500`）だが **UI 未接続**。クランプ多用で `clampHitCount` 追跡あり | 🟡 |
| M2 | Active-stress MVP | 最優先 | 実装済・既定化済だが **未校正**（`ModelCore.ts:188,725`）。`ChamberModel` interface 不在＝switch ハードコード（`ModelCore.ts:681`） | 🟡⛔ |
| M3 | Web preview hardening | 最優先 | 固定ステップ✅ / param 平滑化✅（`smoothParams`）/ ring buffer✅。だが **Web Worker 化されておらず** sim が React 内（`WorkbenchPage.tsx:160`）。禁止事項 #1 違反 | 🟡⛔ |
| M4 | Clinical knobs | 高 | contractility 等のノブはあるが `ClinicalKnobs` 写像層・raw param の advanced 隠蔽は未整備。弁 raw param が前面 | 🟡 |
| M5 | Dynamic Vu / venous tone | 高 | Vu ODE 不在。`venousTone` をパラメータ平滑化で代用（`effectiveVu`） | ❌ |
| M6 | Respiratory / PEEP | 高 | `Pth`/`Palv` 正弦波実装済（`ModelCore.ts:864`）。PEEP 係数 0.20 は仕様と差異 | 🟡 |
| M7 | Accurate engine | 中〜高 | `.py` / 高次 solver 不在。参照解なし | ❌ |
| M8 | Baroreflex | 中 | 未実装 | ❌ |
| M9 | Pericardium / VI | 中 | `Pperi=Pth` のみ（指数則・VI なし） | ❌ |
| M10 | Organ venous beds | 中 | 未実装。トポロジがハードコード（`buildNodes/buildEdges`） | ❌ |
| M11 | Coronary | 中 | 未実装 | ❌ |
| M12 | Calibration / UQ | 高だが後段 | 未実装。**← 本改訂で前倒し** | ❌ |
| M13 | Case branch engine | アプリ側と同期 | presets / Scenarios / official cases route は一部あり。`CaseSpec`/`ScenarioBranch` 型は未整備 | 🟡 |

関連: χ 連動 collapse（R(χ)/B(χ)）はコード実装済だが既定 off（`useChiResistance:false`）。Guyton パネルは UI スタブ（`components/Charts.tsx:498` "Guyton Plot Disabled"）。

---

## 3. 基本方針（踏襲）

1. **Preview engine と Accurate engine を分ける。** Preview = TS/WASM・固定ステップ・リアルタイム優先。Accurate = Python/native・BDF/Radau/DAE・検証/校正優先。
2. **graph core と chamber module を分ける。** graph core = node/edge/flow/mass balance。心室圧 = `ChamberModel` plugin で差し替え。
3. **段階的複雑化。** waterfall → R(χ) → B(χ) / active-stress MVP → 心膜/VI → force-velocity / single vein → 臓器別床。
4. **全 upgrade に invariants / health checks を付ける。**（§6 acceptance criteria 参照）
5. **AI は source of truth ではない。** engine が計算の真実。LLM 由来 patch は validation と user review を通す（`requiresReview:true`）。
6. **（追加）魔法定数を残さない。** fudge factor（`f_iso`, `*TmaxScale` の桁合わせ）は技術的負債として登録し、calibration で退治する（§7）。

---

## 4. 改訂ロードマップ（並べ替え後）

### Phase S — Stabilize-first（最優先・新機能の前に完了させる）

元計画 M0–M3 を「定義充足」まで仕上げ、M12 の最小版を M2 と並走させる。新機能（M4 以降）はこの Phase 完了後に着手する。

- **S0 = M0 を実体化**
  - `baseline-normal` パラメータセットを固定（現 `DEFAULT_PARAMS`＝active-stress 既定）。
  - 30 秒シミュレーションの AoP/PAP/QAo/QPA/SV/CO を snapshot 化（`engine/__tests__/snapshots/`）。
  - **このベースラインは「現行 active-stress 出力の固定」であり、change-detector（意図しない挙動変化の検出）に使う。生理的に正しいことの証明ではない（= baseline ≠ validated）。物理的妥当性の検証は M12 の責務。**
  - スナップショット回帰テストを CI 可能な形で追加（§6 を assertion 化）。
  - 受入: TBV drift < 0.1%/60s、NaN/Inf なし、ξ∈[0,1]、典型波形。

- **S1 = M1 を完成（health / limitation を「低ノイズ UX」で）**

  設計原則: 画面は既に情報過多。**健全時は health を一切見せない。limitation は毎回・大面積で出さない。** ユーザーに常時意識させないことを最優先する。

  **Health UX（持続状態として扱う。イベント扱いしない）**
  - **主シグナル（持続・文脈依存）**: 各インスタンスの凡例チップに小さな状態ドット。`ok` で無色/非表示、`warning` で amber、`unstable` で red。health はインスタンス単位なので凡例に紐づける。チャート本体は色で塗らない。
  - **遷移の注意喚起（一過性）**: `ok→warning` / `→unstable` の**状態遷移時のみ**、右下に自動消滅トースト（debounce 付き）。例「Heart A: TBV drift 1.2% — unstable」。消えても凡例ドットは残る。
  - **詳細（オンデマンド）**: ドット/トーストのクリックで小 popover に `health().messages` を表示。常設の health パネルは作らない。
  - **`unstable`→fallback/auto-pause のみ例外的に明示**（sim が止まる状態はユーザーが知る必要があるため、消せるが目立つメッセージ）。

  **Model limitation UX（毎回出さない。承認を記録する）**
  - **初回ゲート（一度だけ）**: 最初の simulation 表示前に限界・免責（研究/教育用・臨床判断に使わない）をモーダル表示し、「理解しました」で閉じる。`localStorage` に記録し以後出さない。承認の記録が残る点で安全機能としても機能する。
  - **常時の極小アフォーダンス**: ヘッダ/フッタに `ⓘ 教育用モデル・限界` の小アイコン1個。クリックで全文再表示。常に到達可能だが場所を取らない。これで仕様 §23-5「出力とともに表示」を*出力近傍の恒久マーカー*として満たす（大面積常設は要求しない）。

  **非目標（やらないこと）**: 常設 health パネル、健全時の health 表示、毎フレームのトースト、大面積の limitation バナー、薄いテキストの常時表示。

  - 受入: HR/SVR/venous tone/PEEP/contractility を急変させても 5 分相当継続。健全時は health 由来の表示が画面に出ない。warning/unstable で凡例ドットが変化し、遷移時のみトーストが出る。limitation は初回1回＋ⓘから到達可能。

- **S2 = M2 を構造化＋脱負債** ✅ 実装済（S2a + S2b）
  - **S2a**: `ChamberModel` interface へリファクタ（`ElastanceChamberModel` / `ActiveStressChamberModel`、`engine/chambers.ts`）。`heartModel` switch を plugin dispatch に置換。挙動ニュートラル（D5 解消）。
  - **S2b（脱魔法定数）**: `lvTmaxScale=4.5` を `Tmax0` に畳み込み、既定 scale=1.0。スライダー/clamp も 1.0 基準へ再センタリング（D1 解消）。
  - **方針転換（ドメイン専門家の指示）**: calibration は「正常 metric 値（CO/EF/MAP）への再フィット」ではない。**波形の形（AoP/LVP、aortic notch、LV PV loop、MV flow）が最優先**で、active-stress の形は既に良好。よって畳み込みで形を保ったまま魔法定数のみ除去。`f_iso` は校正後に波形を見て判断（保留）。
  - **health 再定義**: health = モデル/数値妥当性のみ。正常値逸脱では warning を出さない（異常ケースのシミュレーションが主目的）。`physiologicalRange` 警告を撤去。
  - **elastance の位置づけ（訂正済み）**: elastance は *validated reference ではない*。実波形は active-stress のほうが実臨床に近い（Ca/troponin 動力学により dP/dt・等容相が現実的）。**いずれのモデルも M12 までは "validated" ではない。** elastance は ①`unstable` 時の数値フォールバック ②教材としての対比トグル（Note パネルが elastance を解説）の2用途に限定して残す。**回帰/物理検証の golden には使わない**。物理的検証の golden は M12 で校正後の active-stress 定常出力とする。
  - 受入: active/elastance を UI 切替可。3 ノブ（Contractility/Relaxation/Diastolic stiffness）が直感的に作用。魔法定数が技術的負債レジスタ（§7）から消える。

- **S3a = M3 を完成（駆動ループの分離）**
  - sim 駆動ループを `WorkbenchPage.tsx` の `useEffect` から framework 非依存の controller モジュール（例: `engine/PreviewController.ts`）へ抽出。`ModelCore` は既に分離済みなので、ループだけを移す。
  - これで禁止事項 #1（React component 内に sim core を書かない）の本質＝関心の分離を達成し、S0 のヘッドレス snapshot 生成にも再利用できる。**Worker は不要**。
  - 受入: スライダー連続操作でも UI が固まらない。speed 1x で 60fps 相当。speed 5x でも health warning 以外は安定。React 再レンダリングと sim ステップが疎結合。

- **S3b = Worker オフロード（遅延・トリガー駆動。Phase S 完了の前提ではない）**
  - Preview engine を Web Worker へ退避し、postMessage / transferable buffer で UI と通信。
  - **発火条件（いずれか観測されたら着手）**: ① speed 5x × 複数インスタンスで frame drop / スライダー応答劣化を実測 ② M7 accurate engine 統合 ③ M10 臓器床で node 数が増大。
  - 留意: シリアライズ境界によるパラメータ更新レイテンシ、SharedArrayBuffer 使用時の COOP/COEP（cross-origin isolation）要件。現時点（15 node・RK2・1ms）では計算が軽く正当化されないため、measured need が出るまで着手しない。

### Phase A — 生理の幅（Phase S 完了後）

- **M4 Clinical knobs layer**: raw param を `ClinicalKnobs` 写像へ。raw editor は advanced/debug に隠す。
- **M5 Dynamic Vu / venous tone**: `τ_u·V̇u = Vu_target − Vu` を SV/VC/PVein/PVen に実装。出血・輸液シナリオへ接続。
- **M6 呼吸/PEEP 精緻化**: PEEP→Pth/Palv の係数（現 0.20）を文献整合へ。肺 waterfall を RLC 化。

### Phase B — 信頼性の深化

- **M7 Accurate engine**: Python `solve_ivp(Radau|BDF)` + 周期定常解ソルバ。preview と同一 param で突き合わせ（10–30 拍後の SV/CO/AoP/PAP 乖離小）。
- **M12 Calibration / UQ（フル版）**: S2 の最小校正を HFrEF/HFpEF/AS/MR/PH/RV梗塞/PEEP/出血 へ拡張。目的関数 `J(θ)`、検証指標表、不確実性の UI 反映。

### Phase C — 連関と臓器

- **M8 Baroreflex**: MAP low-pass → HR → contractility → arteriolar R → venous tone の順で段階導入。
- **M9 Pericardium / VI**: 心膜指数則 + 簡易 VI（TriSeg-lite）。PH/RV 不全/タンポナーデ。
- **M10 Organ venous beds**: renal/hepatic/splanchnic/muscle/skin/brain。**前提: トポロジのデータ駆動化**（`buildNodes/buildEdges` のハードコード解消）。
- **M11 Coronary**: LAD/LCx/RCA、心筋内圧 `P_im`、収縮期冠血流低下。

### 横断 — M13 Case branch engine

`CaseSpec`/`ScenarioBranch`/`ParameterPatch` 型を整備。LLM 由来 patch は `requiresReview:true` 固定。アプリ側（official cases）と同期して随時。

---

## 5. バージョン計画

| Ver | 内容 | 対応 |
|---|---|---|
| v0.1 | 数理 preview MVP（graph closed-loop / 動的弁 / 動脈非線形 PV / 3相静脈 / waterfall / elastance fallback） | 実装済 |
| v0.2 | Active-stress MVP（phase state / LV/RV active-stress / Ca surrogate / **chamber plugin** / 3ノブ / active↔elastance 比較） | S2 |
| v0.3 | Stability & health（SimulationHealth / invariants / 状態制約 / fallback / param 平滑化 / baseline snapshots） | S0,S1,S3 |
| v0.4 | Case branch preview（CaseSpec/ScenarioBranch / branch 比較 / PVループ・波形・metrics / Note renderer） | M13 |
| v0.5 | Venous / respiratory（dynamic Vu / venous tone / PEEP / 呼吸変動 / 肺 waterfall 精緻化） | M5,M6 |
| v0.6 | Accurate engine（Python Radau/BDF / 周期定常解 / preview↔accurate 比較） | M7 |
| v0.7 | Reflexes（baroreflex / HR・R・contractility・venous tone 制御 / 出血・輸液） | M8 |
| v0.8 | Heart interaction（pericardium / VI / TriSeg-lite / PH・RV failure） | M9 |
| v0.9 | Organ beds & coronary | M10,M11 |
| v1.0 | Educational validated model（official baseline cases / 限界明示 / health 表示 / 校正レンジ / validation notebook / export） | M12 |

---

## 6. マイルストーン別 acceptance criteria（＝回帰テスト仕様）

元計画 §18 を踏襲。各項目はそのまま自動テストの assertion にする。

**Core graph**
- 総血液量 drift < 0.1% / 60s preview
- 各 edge 方向と node mass balance の符号一致
- topology table を自動表示できる

**Valves**
- 0 ≤ ξ ≤ 1 / 狭窄で forward flow 低下 / 逆流で regurgitant fraction 上昇 / 弁閉鎖時に数値爆発なし

**Venous model**
- Vu 変更で stressed volume 変化 / collapse 時に flow limitation / overdistension で C 低下 / V = Vu + S(Pᵗᵐ) が常に計算可能

**Active-stress**
- c ≥ 0, 0 ≤ a ≤ 1 / contractility↑ で SV・ESP↑ / relaxation 悪化で EDP↑ / diastolic stiffness↑ で EDPVR↑

**Respiratory / PEEP**
- PEEP↑ で venous return 低下 / PEEP↑ で肺血管 waterfall 影響増 / 胸腔圧変化が RAP/LAP に反映

**Baroreflex**
- MAP↓ で HR/SVR/contractility/venous tone↑ / MAP↑ で逆 / response time が速すぎない

**（追加）Preview↔Accurate**
- 同一 param で 10–30 拍後の SV/CO/AoP/PAP が許容誤差内

---

## 7. 技術的負債レジスタ

新機能追加の前に意識的に返済する。Phase/担当 ID を付けて追跡。

| ID | 負債 | 箇所 | 影響 | 返済先 |
|---|---|---|---|---|
| ~~D1~~ ✅ | `lvTmaxScale=4.5` 魔法定数 | `engine/chambers.ts` Tmax0 | **解消（S2b）**: 4.5 を `Tmax0` に畳み込み（LV 382500 / RV 162000）、既定 scale=1.0。波形は byte-identical。スライダー/clamp も 1.0 基準へ再センタリング | done |
| D2 | 仕様外の `f_iso` 即席項 | `engine/chambers.ts` | 力-長さ依存が ad-hoc。**ユーザー判断: 校正後に波形を見て残す/置換/除去を決定**（保留） | post-cal |
| D3 | 導関数・状態の広範クランプが現役動力学化 | `ModelCore.ts:599,601,623,915` | クランプ発火中は方程式が歪む | S1,S3（積分法改善でクランプを安全網に戻す） |
| D4 | sim 駆動ループがメインスレッド React 内 | `WorkbenchPage.tsx:160` | 禁止事項 #1 違反・UI ブロック懸念 | S3a（controller 抽出で解消。Worker=S3b は別） |
| ~~D5~~ ✅ | 心室モデルが switch ハードコード | `engine/chambers.ts` | **解消（S2a）**: `ChamberModel` interface ＋ `ActiveStressChamberModel`/`ElastanceChamberModel` に抽出。挙動ニュートラル（snapshot 不変） | done |
| D7b | 心房 active-stress 化の足場不足 | `ModelCore.ts` 状態ベクトル | ChamberModel は導入したが内部状態 `c/a` の slot が LV/RV 固定。心房 active-stress には per-model state slot 化が必要（レビュー指摘） | M9 前提 |
| D6 | トポロジがハードコード | `buildNodes/buildEdges` | 臓器床/VAD/ECMO の足場欠如 | M10 前提 |
| D7 | `health()`/`metrics()` が UI 未接続 | `WorkbenchPage.tsx` | health warning が出ない（M1 未達） | S1（凡例ドット＋遷移トースト＋popover、健全時非表示） |
| D8 | `Model limitation` 表示なし | UI 全般 | 仕様 §23-5・§24-12 未達 | S1（初回モーダル＋ⓘ極小アイコン。大面積常設はしない） |
| D9 | 回帰テスト 0 件 | — | 拡張で静かに破綻 | S0 |
| D10 | PEEP→Pth 係数 0.20 の根拠不明 | `ModelCore.ts:865` | 呼吸応答の定量が未検証 | M6 |

---

## 8. 実装上の禁止事項（踏襲）

1. React component 内に simulation core を書かない。（現状 D4 で違反中 → **S3a の controller 抽出で解消**。Worker 化 S3b は別問題で、本条の達成に必須ではない）
2. UI スライダーの値を状態へ瞬時ジャンプさせない（必ず平滑化）。
3. LLM patch を validation なしに simulation へ反映しない。
4. collapse で Pd*, R(χ), B(χ) を最初から全て強く入れない（waterfall → R(χ) → B(χ) の順）。
5. active-stress MVP で force-velocity を入れない。
6. model limitation なしに教育・症例ページを出さない。
7. raw parameter を初学者向け UI の主役にしない。

---

## 9. 直近の着手順（結論）

1. **S0**: baseline snapshot ＋ 回帰テスト雛形（TBV保存・左右CO・SV=PVループ面積）
2. **S1**: `health()` UI 接続 ＋ `Model limitation` 表示
3. **S2**: `ChamberModel` plugin 化 ＋ calibration 最小版（D1/D2 退治）
4. **S3a**: 駆動ループを controller モジュールへ抽出（S0 と対で進めると良い）
5. 以降 M4 → M5 → M6 → M7/M12 → M8 → M9 → M10/M11
6. **S3b（Worker オフロード）は遅延**。§4 の発火条件が観測されたら割り込みで着手

この順なら、Web app のリアルタイム性を壊さず、未校正モデルを既定に据えたリスクを早期に解消しつつ、生理モデルの深さへ拡張できる。
