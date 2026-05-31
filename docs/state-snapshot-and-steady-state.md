# State Snapshot / Steady-State / Warm-Start 設計（チーム共有）

最終更新: 2026-05-30（実装状況注記: 2026-05-31）
ステータス: **設計合意 → 一部実装済み**。3者独立レビュー2ラウンド（本実装者 ＋ Claude Opus 4.8 ＋ Codex 5.5 xhigh）の統合。
> **実装状況メモ (2026-05-31):** M12-lite 較正で settle 是正が確定 —
> frozen-snapshot 用に `BASELINE_OPTIONS.settleSeconds` 8→60、grounded 計測は `settleMode:"converge"` +
> `settleStatus.settled` 確認（チーム標準）。`sanitizeParams` 実装済み。converge 収束判定・warm-start
> seed は段階導入中。経緯は [research/m12-lite-calibration-journal.md](research/m12-lite-calibration-journal.md) §Snapshot/settle。
関連: [ROADMAP.md](ROADMAP.md), [PHASE_A_PLAN.md](PHASE_A_PLAN.md), 別実装の `caseOps.ts`（op-stack / save-share）。

> この文書は engine 側（`ModelCore`/`previewController`/`harness`/`protocol`）の「収束判定・状態スナップショット・warm-start」設計と、それが `caseOps.ts`（save/share/export/API/MCP）とどう噛み合うか（canonical vs cache）を定める。**別実装チーム（caseOps）向けの要対応項目は §6**。

---

## 0. なぜ必要か（背景）

- **重要な実測**: このモデルは**周期定常（極限周期）到達に sim 時間で約 35–60s** かかる（低収縮・低 HR ほど長い）。
- settle の現状（重要な区別）:
  - `previewController.ts` … pre-settle **3s** のみ＋chart buffer 空で開始 → **ライブ UI が数十「実」秒かけて収束**（3s 後は 1× 実時間でライブ収束していたため）。**これが本問題**。
  - `harness.ts` … 固定 settle **8s** だが、その後 **measure 30s** を回す（計 38s）。収束は ~23–30s なので **measure 終端（metrics は最終1拍）は収束済み** → **S0 baseline snapshot は実質 settled**（当初「transient で凍結」と記したが、計38s が収束を越えるため不正確だった。訂正）。ただし固定時間依存・停止位相依存（§2.5）は残る。
  - 実測（tolPrimary=0.005）: baseline 収束 ~23s sim（worst signal は LAP 等の遅い静脈側）、低収縮で ~79s sim。
- ただし「数十秒待つ」は誤解。**収束は headless（60fps に律速されず全力）で回せば wall-clock ~1.6s**（実測: 60s sim ≈ 1.6s、約 37× 速）。→ ロード時に headless で一気に settle すれば ~1–2 秒。
- さらに、**保存した収束状態ベクトルを seed すれば settle 不要（warm-start）で即時**。これは save/share の前提でもある。

---

## 1. 概念の整理（最重要）

**StateSnapshot（instance の状態ベクトル `x`）は「DAE/ODE の初期条件」そのもの。エンジンは初期状態が無いと積分できない。**

- 現状その役割は `buildNodes` の **ハードコード `x0`（cold・generic・未収束）**。
- warm-start ＝「cold `x0` の代わりに**収束済みの良い初期条件**を seed する」だけ。
- ⇒ `exportStateSnapshot`/`loadStateSnapshot` ＋ `settleToSteady` は **optional な最適化ではなく必須のエンジン基盤**。

「cache（非 canonical）」が成り立つ精密な意味（steady と transient で違う）:

| 保存対象 | params から再計算可能か | 位置づけ |
|---|---|---|
| **steady な instance** | 可（自律系＝極限周期は params の純関数。cold から settle で必ず同周期へ、~1.6s） | knob が source of truth、steady `x` は**再生成可能 cache**。ただし初期条件としては必須（cold `x0` がフォールバック） |
| **transient/forced**（出血中で一時停止 等） | 不可（経路依存。特定過渡点は params だけでは復元不能） | 状態ベクトルの保存が**本質的に必須**（`kind:"transient"`） |

注意（多安定性）: 「params→steady を一意に再計算」は**アトラクタが一意**である前提。正常生理ではほぼ単一安定だが、強非線形（虚脱の bistability 等）で複数 basin があり得る。その稀ケースでは steady `x` も「どの basin か」を保持する意味を持つ。実害はまず無いが但し書きとして残す。

---

## 2. Steady-state 検出器（engine）

### 2.1 追跡信号
**拍ごとの集約値**（瞬時同位相比較は wall-clock サンプリングのエイリアスで不可）。一次: `AoPMean, PAPMean, RAPMean, LAPMean, SV_L, SV_R, EDV_L, EDV_R, Pmsf, TBV`。二次(shape): `AoP/PAP sys,dia, ESV, LV/RVEDP`。
現 `computeCycleMetricDelta()` は AoP/LAP のみで**右心系・肺・SV・静脈リザーバの収束を取りこぼす**ので拡張する。**Pmsf/RAP は最遅の静脈リザーバを捉えるため必須**。

### 2.2 正規化・判定
- スケールフリー: `Δ = |a−b| / max(|a|, |b|, floor)`、floor 例 = 動脈圧 20 / 充満圧・Pmsf 5 / SV 10 / EDV・ESV 20 / TBV 1000（mmHg・mL）。**score = 全信号の max**（最悪信号が支配）。
- 閾値（**実測校正**）: 一次 `< 0.5%`（tolPrimary=0.005）、shape `< 1.0%`、`minBeats=8`、**連続 `N=3` 拍**で settled、`postSettleBeats=1`。当初 0.2% は LAP 等の小信号で sampling-grid aliasing 床（~0.2%）に当たり flicker したため 0.5% へ。
- **cap は秒でなくステップで pin**（`capSteps = round(capSeconds/dt)`、cross-machine 決定論）。既定 `capSeconds ≥ 90`（低 HR/低収縮で 60s 必要なため余裕）。
- **2-tier**: tight（テスト/harness, 0.2%）と loose（preview, ~1%・速い）。preview は loose で十分（視覚的に区別不能）。

### 2.3 拍境界・period
`floor(phi)` の増加で拍を閉じる（`phi` は累積拍・単調）。RK2 は固定ステップなので**整数 phi に合わせて step を割らない**（最初の超過サンプルで停止）。candidate period `[1,2,3,4]` を内部サポート（将来の alternans/pulsus は period-2 で扱い、誤って period-1 settled としない）。

### 2.4 エッジ・失敗モード
- **HR/param 変更**: 拍集約を無効化し、新規 1 拍後に再開。`p≈pTarget`（smoothing τ=0.25s）まで待つ。
- **出血/輸液（forced-trend）**: `projectTBV && |fluidRate−bleedRate|>ε` で **`forced-trend` を即返し、絶対に settled としない**（台帳が毎ステップ前進＝極限周期が存在しない）。metrics は「軌道上の瞬時値」と理解。
- **非収束/振動**: cap 到達で `reason:"cap"`、worst signal を返す（throw しない）。
- **生理的異常は警告しない**（health は数値妥当性のみ。S2b で確立済）。

### 2.5 API・統合・計算
```ts
type SettleStatus = { settled: boolean; reason: "converged"|"cap"|"forced-trend"|"unstable";
                      actualSeconds: number; beats: number; worstSignal: string|null; worstDelta: number };
ModelCore.assessSteadyState(opts): SteadyStateReport     // read-only（自前の拍集約を保持、1200-sample rolling history に依存しない）
ModelCore.isSettled(opts): boolean
ModelCore.settleToSteady(policy): SettleStatus           // step を回して収束 or cap。決定論契約はこれに束ねる
```
- `harness.runScenario` の固定 8s settle → `settleToSteady` に置換（baseline snapshot は §6 の方針で扱う）。
- `previewController` の 3s pre-settle → `settleToSteady`（loose, cap）。
- **計算**: ライブ 60fps は削減ゼロ（描画継続が必要）。settle フェーズのみ honest 化（易しい case を早期停止／難しい case を正しく延長）。検出器自体のコストは拍境界で O(samples/beat)、無視できる。
- ⚠️ **`metrics()` は単一拍・任意停止位相**（`this.t - oneBeat`）→ 収束しても停止位相で値が変わる＝**決定論の隠れ依存**。→ **整数拍集約（phi 整列）／post-settle record window からのみ報告**に直す。

---

## 3. StateSnapshot / warm-start（engine）

### 3.1 「x だけ」では復元不完全（重大）
状態は `x` だけではない。**`initialTBV`/`expectedTBV`（TBV 台帳）・`clampHitCount`・`t`・`history`・chart buffer は `x` の外**にある。`core.x = v` だけだと:
- 次 step で `projectTBV` が静脈圧を**古い `expectedTBV` へ引き戻し**、warm-start を部分的に台無しに。
- health が誤った基準で比較。
→ **load は台帳・clock・history も原子的に復元**する。

### 3.2 完全な StateSnapshot（versioned・keyed・self-describing）
```ts
type StateSnapshot = {
  kind: "steady" | "period2" | "transient" | "trend";
  schemaVersion: number;            // 破壊的変更で bump
  schemaHash: string;               // makeIndex()/node・edge・valve 構成のハッシュ（slot 意味ズレ防止）
  engineVersion: string;
  paramHash: string;                // 解決後 sanitize 済 CoreRuntimeParams + targetVolume のハッシュ
  solverHash: string;
  clock: { t: number; phi: number; respPhase: number };   // 呼吸 ON では t 依存＝必須
  ledger: { initialTBV: number; expectedTBV: number };
  state: KeyedStateSlots;           // 素配列でなく名前付き（nodes.LV / flows.AoV / phase.phi / active.LV.c …）。内部で Float64Array にコンパイル
  recentSamples?: SimSample[];      // history/chart seed（chart 窓 ＋ 2 拍ぶんで十分）
  settleStatus?: SettleStatus;
};
ModelCore.stateSchemaHash(): string
ModelCore.exportStateSnapshot(): StateSnapshot
ModelCore.tryLoadSnapshot(snap, expectedKey): { ok: boolean; migrated: boolean; reason?: string }
```
- **素の `Float64Array` を保存/共有しない**。長さ不一致は検出可だが**同長で意味ズレ＝サイレントなゴミ**（M5b で Vu 状態追加、後で臓器床…とレイアウトは必ず変わる）。名前付き slot にして**名前キーでマイグレーション**。
- **`recentSamples` が無いと metrics/PV ループが出ない**（metrics は history 依存、無いと SV/CO=0）。warm-start でも 1–2 拍ぶんの seed が必要。

### 3.3 load / validate / fallback ladder
```
load(instance):
  resolved = resolveInstance(instance, baselines)          // canonical を常に計算
  expectedKey = {engineVersion, stateSchemaHash, knobMappingVersion, paramHash(resolved), solverHash}
  if snapshot exists AND key deep-equals expectedKey AND x.length===idx.size:
      hydrate: x ＋ ledger ＋ clock(t,phi,respPhase) 復元、recentSamples で history seed
      短い検証窓を回し isSettled（tolerance 内）→ OK なら即表示（warm）
      NG（fixed point でない）→ settleToSteady（near attractor で速い）
  else (key 不一致 / schema 非互換 / snapshot 無し):
      DISCARD → cold settle（settleToSteady, ~1.6s/instance）
```
- ⚠️ **cache キーは「解決後 params」をハッシュ**（knob でなく）。`rawPatch` が勝つ＆`resolveKnobsToParams` が版依存のため。
- cache は **settle 完了時のみ生成**（live mid-edit の `setImmediateParameters` 由来の lag 状態を載せない）。

---

## 4. アーキテクチャ決定: canonical vs cache

| | canonical（正本・共有・version-robust） | cache（派生・高速化） |
|---|---|---|
| 実体 | **CaseDocument**（baseline / clinical knobs / 順序付き interventions / rawPatch / targetVolume / layout / notes / **modelLimitations 必須** / SolverConfig） | **StateSnapshot**（§3） |
| 原則 | 物理状態は ephemeral・毎回再導出 | `MetricsFingerprint` 同類「NOT a source of truth」 |
| 共有 | する | **optional・validated・discardable** に同梱可（下記） |

### 共有時の挙動（ロードの待ち時間）
| ケース | cache | 待ち |
|---|---|---|
| official case / 自分の local my-case（同エンジン） | 有効 | **ほぼ瞬時**（warm-start） |
| community case・同エンジン版・cache 同梱 | 有効 | **ほぼ瞬時** |
| community case・cache 無し or 別エンジン版 | 破棄→cold | **~1.6s/instance**（短いスピナー） |

- レビュアー当初案「cache は共有に載せない（strip）」を**リファイン**: cache は**載せても安全**（受信側がキー検証→不一致なら破棄して ~1.6s cold settle にフォールバック）。Web app は通常**全ユーザー同一デプロイ版**なので、共有 community case の cache は大半が有効＝瞬時。不整合は「エンジン更新後に古い共有 case を開く」場合だけで、その時も ~1.6s。
- **transient/forced save は cache 同梱必須**（再計算で同じ過渡点に戻れないため、ここでは実質 canonical）。
- UX: cold ロード時だけ ~1–2s の `settling…` を出す。warm では何も出さない。

---

## 5. 実装フェーズ（engine 側）

1. **検出器コア**: `assessSteadyState`/`isSettled`/`settleToSteady`（§2）。harness/preview を移行。→ テスト/e2e がまず堅牢に。
2. **metrics の phi 整列**（§2.5）＋ **StateSnapshot export/load**（§3）＋ **warm-start mount**（previewController が `core.x` 直叩きをやめ API 経由、`core.t=maxT` 廃止し display-offset 化で呼吸 desync 修正）＋ **buffer プリフィル**。`BASELINE_STEADY_STATE`（DEFAULT_PARAMS の収束 x）を生成・チェックイン。
3. **baseline テストの再構成**（§6）。
4. **caseOps 連携**（§6、別チーム協調）。

各ステップは回帰テスト＋2者レビューゲート（1/2・改善案込み）を通す。

---

## 6. caseOps 連携で要対応（別実装チーム向け）

両レビュアーが独立に収束した、`caseOps.ts` ＋ engine の**統合に必須**の項目。

**MUST-ADDRESS**
1. 🔴 **`settleSeconds=8` は transient を報告**（測定 35–60s）。caseOps `DEFAULT_SOLVER`・harness・previewController すべて。→ **`SolverConfig` を収束ポリシーに**:
   `SolverConfig { dt; sampleHz; recordSeconds; settle: { tolerance; consecutiveBeats; capSeconds; forcedTrendPolicy } }`。決定論契約は engine の `settleToSteady` に束ねる。
2. 🔴 **`metrics()` の停止位相依存**（§2.5）→ 整数拍集約／post-settle window のみから報告。
3. 🔴 **`sanitizeParams` が `engine/protocol.ts` に不在**（検証済。caseOps が import しているが未実装）。**弁キー `MV_*/AoV_*/TV_*/PV_*` と scale knobs を保存しないと弁膜症介入が全 no-op**。最優先で実装＋キー保存。
4. **`knobMappingVersion` の registry/dispatch が無い**（単一関数）→ `RESOLVERS: Record<version, fn>`、`resolveInstance` が doc の版で dispatch。M2 で「新マッピング追加・旧 case 温存」を可能に。
5. **現 `SimInstance.params`（raw 主）が caseOps の knob 主と不整合**。アプリが resolve pipeline（knobs→params）を採用する必要。
6. **未知 baseline の silent fallback 禁止**（share/API では生理が黙って変わる）→ load error or review-gated migration。
7. **`reviewByHealth` に flowBalance＋未収束（settleStatus）を含める**（現状 左右 CO 不一致・not-settled を無視）。
8. **`migrateDocument(schemaVersion)` が無い**。op-log は fold して破棄（snapshot のみマイグレーション保証）。
9. **StateSnapshot は local 限定 cache・厳格キー・settle 完了時のみ**（§3–4）。

**NICE-TO-HAVE**
- MCP ツール本体は op 本体と isomorphic だが**永続 envelope とは別**（opId/ts/review/grounding return は wrapper 概念）。`fit_to_targets`/`run_sweep` は op でない（reducer の純粋性を壊さない）ことを明記。
- `MetricsFingerprint` に `paramHash/solverHash/settleStatus/recordWindow` を付与し**版ズレ検出**に。
- `rawPatch` が勝つので、影で上書きされた knob/intervention を「overridden by rawPatch」と返す。`rawPatch` 保有 instance に `requiresEngineVersion` を付け版ズレを警告。
- reducer の strict/permissive モード（replay は寛容、import/MCP は missing target/unknown id で loud に失敗）。
- CRDT は将来の共同編集で op-stream を**包む**用途のみ。canonical materialized snapshot を置換しない。

---

## 7. 統合型契約（engine ↔ caseOps の境界）

```ts
// caseOps（canonical 側）
SolverConfig { dt; sampleHz; recordSeconds; settle:{ tolerance; consecutiveBeats; capSeconds; forcedTrendPolicy } }
DerivedStateCache { key; snapshot: StateSnapshot; settleStatus; engineVersion } // 非canonical・local限定・export時strip可
// engine/protocol（cache 側）
StateSnapshot { kind; schemaVersion; schemaHash; engineVersion; paramHash; solverHash;
                clock{t,phi,respPhase}; ledger{initialTBV,expectedTBV}; state: KeyedStateSlots; recentSamples?; settleStatus? }
SettleStatus { settled; reason; actualSeconds; beats; worstSignal; worstDelta }
// engine API
ModelCore.stateSchemaHash() / settleToSteady(policy) / exportStateSnapshot() / tryLoadSnapshot(snap, expectedKey) / isSettled()
```
**canonical = CaseDocument(knob主)**。**cache = StateSnapshot**（解決後 params 等でキー、検証→不一致は破棄して cold settle）。物理状態を保存しない原則を保ちつつ warm-start を得る。

---

## 8. レビュー出典（トレーサビリティ）
- 検出器設計: 本実装者の原案 ＋ Claude Opus 4.8（独立）＋ Codex 5.5 xhigh（独立・**実測校正**）。
- warm-start / StateSnapshot: 本実装者の warm-start 原案 → Opus・Codex 独立レビューで「x だけでは台帳ズレ」「versioning 必須」「isSettled は許容閾値」「呼吸位相」「history seed」「baseline テスト分離」を指摘 → 本書に反映。
- caseOps 連携（canonical vs cache・settleSeconds=8・sanitizeParams 不在・metrics 停止位相・knob-mapping registry 等）: Opus・Codex 独立レビューが収束。`sanitizeParams` 不在は repo で検証済。
- 実測: 収束 35–60s（sim）、headless settle ~1.6s（wall-clock, 37×）。
