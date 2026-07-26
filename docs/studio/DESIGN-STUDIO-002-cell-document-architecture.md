---
title: "DESIGN-STUDIO-002 — Studio architecture: cell / document, runtime, and the presentation ↔ engine boundary"
status: "Draft for design & implementation team"
date: "2026-07-24"
revision: "2 — adds identity split (Experiment / CellPlacement / Session), multi-scenario live transition, model-owned catalog, V&V decoupling, and the loose-coupling port/interface design. Corrects the earlier 'engine change = zero' and 'fullscreen = show-everything' claims."
supersedes_scope_of: "ADR-STUDIO-001 (surface/IA portions)"
audience: "design + implementation team"
note: "Design narrative AND normative contract. It records the *reasoning* and *rejected alternatives* (so intent can be re-derived at edge cases) and the *typed contracts* at the boundaries (so multiple teams can implement in parallel)."
---

# DESIGN-STUDIO-002 — Studio architecture

> webapp 全体の IA / UI / UX / design / command 層 / runtime / 疎結合境界を再設計するための長い議論の到達点を、**背景・理由つき**かつ**実装に渡せる契約つき**で書き下ろす。engine(数理モデル)は coronary / mechanical support / rhythm まで統合されほぼ完成しており、今後の開発予算は presentation 層に充てる前提。

**この revision(2)で変わった主要点:**
- 中心原則を「全部 extent に畳む」から「**別 surface に移動しない**」へ格下げし、直交4軸(Extent × Capability × RuntimeState × Context)を明示(§1)。
- "cell" は UI 語であり、ドメインでは **Experiment(durable) / CellPlacement(document内配置) / Session(ephemeral)** の3つに割れることを明記(§2)。
- **catalog は model id/version が所有**(§2.3)。coronary 等の機能差を catalog manifest で表す。
- **multi-scenario live transition** を runtime の中核として新設(§8.4)。Ees の baseline vs HFrEF はこれ。
- **V&V を実行から疎結合化**:重い V&V は author の compose 時のみ、pin は steady ∧ verification-passed のみ、Reader は certified snapshot から検証ゼロで再生成(§8.6, §11)。
- **RunArtifact をスリム化**:波形・詳細 metric は捨て(再生成)、certified snapshot は残す(§2.5)。
- **presentation ↔ engine の疎結合 port/interface 設計**を新設(§11)。
- 旧記述の訂正:「engine 変更ゼロ・不確実性ゼロ」は撤回(runtime orchestration は変更が要る、warm-restart は要検証)。

---

## 0. 背景(なぜ再設計が必要か)

### 0.1 プロダクトの前提

- 0D 循環動態シミュレータ。engine は coronary flow / mechanical support / rhythm まで統合され**完成間近**。最大の資産、moat。
- 想定ユーザー:**beginner(初期研修医・ME)約5割 / 臨床経験者(循環器・麻酔科の後期研修医・専門医)約4割 / 循環動態研究者 約1割**。**9割が非エンジニア**。mobile 重視。
- 3層の要求を同時に満たす:beginner・臨床家に user-friendly / 実臨床の多様な症例を表現 / 研究者は細かい parameter 変更と正確な値取得。
- 将来 **MCP 化 / webapp 内 LLM 埋め込み**で、レイアウト・controller・metric の自動配置、外部(ChatGPT/Claude)からのデータ利用、症例報告 slide 生成、患者個別 fitting データ受け渡しなどを行いたい。

### 0.2 UI の歴史(なぜ今の形か)

1. **祖先**:graph・metrics・controller・note tile をすべて DnD 移動・resize・追加・削除・編集できる**完全自由 tile**。role area は無かった。
2. **問題**:param が多い controller pane や note pane の scroll が辛かった。
3. **現状**:**role based area + dockview**(main graph / metrics / controller / note)に役割を固定してレイアウトを制限。

### 0.3 再設計のトリガー(繰り返した「詰まり」)

Experiment(記事に埋め込む interactive widget)を作ろうとすると現在の role based workbench では作りづらく、「**完全自由 tile に戻すか、role area のままか**」で延々迷った。さらに次が繰り返し再発:Experiment はどこで作るか / Article はどこで作るか / note pane が狭い / AI assist をどこに置くか / いっそ headless service にすべきか。

### 0.4 根本原因の診断(出発点)

**これらが何度も再発したのは「役割(consume / explore / author)で surface を割ろうとしたから」。** 役割は連続的に移り変わる(読む→触る→残す→書く)。役割で壁を立てると跨ぐたびに「どの surface で / どっちが所有」が生まれる。role area 移行の本当の理由は「scroll が辛い」という**実装都合**で、思想ではなかった。祖先の「全部が1つの連続体」という思想は正しく、**割り方(役割で画面を分断)が誤り**だった。

→ 核心的判断:**役割で surface を割るのをやめる。**

---

## 1. 貫く設計原則

> **役割で画面を割らない。ユーザーが意識するオブジェクトは `cell` と `document` の2つだけ。read → interact → author は「別 surface への移動」ではなく、同じオブジェクトに対する状態の変化として表す。**

### 1.1 「全部 extent」は言い過ぎ ── 直交する4軸(訂正)

初期は「read/interact/author を extent だけに畳む」と書いたが、これは単純化しすぎ。**本質は「別 surface へ移動しない」ことであって「全部 extent」ではない。** 実装上は次の4つを**独立した直交軸**として扱う:

```ts
type Extent      = "inflow" | "peek" | "fullscreen";          // 空間の占有量
type Capability  = "read" | "interact" | "compose";           // 何ができるか（role と publish 文脈が決める）
type RuntimeState= "suspended" | "live" | "verifying" | "verified" | "failed";  // 計算状態（ユーザーは選ばない）
type Context     = "document" | "scratch" | "project";        // どの容器の中にいるか
```

- fullscreen を開いても `Capability` が interact なら compose(graph 追加・raw param 編集)はできない。→ 「beginner は上限が低いのに fullscreen を開ける」という一見の矛盾は、**fullscreen は extent であって compose 権限ではない**、で解ける。
- compose は明確な編集状態であって extent ではない。runtime も permission も extent ではない。

**なぜこれで詰まりが消えるか:** 跨ぐべき「別 surface」が無くなるので、跨ぐときの「どこで / どっちが所有」が構造的に発生しない。

---

## 2. ドメインモデルと identity

### 2.1 "cell" は UI 語。ドメインでは3つに割れる ★重要(identity)

"cell" を1語で全部呼ぶと identity が曖昧になり実装者の解釈が割れる。UI では "cell" を使ってよいが、**ドメイン型としては次の3つに分ける**:

| UI 語 | ドメイン型 | 性質 | 役割 |
|---|---|---|---|
| cell(再利用可能な中身) | `Experiment`(Draft mutable → Revision immutable) | durable | 問い・scenario・view・brief・limitation を持つ再利用単位。**Project が所有** |
| cell(document 内の配置) | `CellPlacement` | durable(document の一部) | Experiment への参照 + 局所設定(inlineMode / localCaption) |
| cell(読者が今触っている物) | `SimulationSession` | ephemeral | N 本の live session + transient patch。捨てる |

これで「同じ Experiment を A記事=inflow / B記事=peek で使う」「読者操作は保存しない」「publish は複数 scenario の run を pin」が一意に表せる。

### 2.2 ユーザーが意識する物は2つだけ(UI レベル)

- **cell** — 1つの問い。extent を持つ(`inflow` / `peek` / `fullscreen`=workbench)。ジェスチャは開く/閉じるの1つ。メンタルモデルは **Jupyter notebook の cell 右上の全画面アイコン**(押すと full-width / fullscreen、閉じると戻る)。
- **document** — cell(CellPlacement)と text の順序つき列。**n=1・text 無しを許す**(chrome を隠せば「ただの workbench 1枚」= 使い捨て臨床医の正体、§7.3)。

### 2.3 Model が Catalog を所有する ★重要

catalog(出せる signal / metric / param / graph type / intervention)は**グローバルではなく `catalog = f(modelId, modelVersion)`**。coronary / mechanical support / rhythm があるモデルと無いモデルで catalog が違い、機能追加で増える。catalog は model が申告する manifest から導出する。

**帰結(見落としやすい):Experiment は run を pin するのと同じ理由で `modelId + modelVersion` も pin する。** coronary 付きモデルで作った Experiment は coronary signal を参照するので、coronary の無い版で開くと参照が浮く。よって:
- Experiment / Revision は `modelId + modelVersion` を必ず記録。
- 「モデルを新版に上げる」は自動ではなく**明示 migration**(catalog item の drop / remap を伴いうる)。run-pinning の model 版、と考えれば一貫。

### 2.4 反映タイミング / rate・ramp は catalog 既定 + author 上書き(locked あり)

transition policy は2層:**catalog(=model)が既定を申告し、author が control spec で上書き**。ただし物理的に強制されるもの(beat 途中で変えると不連続になる量など)は `locked`(上書き不可)。

```ts
interface TransitionPolicy {
  timing: "immediate" | "endSystole" | "endDiastole" | "nextBeat";
  kind: "step" | "ramp" | "rate" | "continuous";
  durationSec?: number;   // ramp
  amountPerSec?: number;  // rate
}
// catalog の param 側に defaultTransition と transitionLocked を持たせる（§11 CatalogParam）
```

### 2.5 永続型(consolidated normative model)

```ts
// ---- 再現性の核（スリム化：波形は持たない） ----
interface RunArtifact {              // immutable / canonical
  id: string; projectId: string;
  model: { id: string; version: string };
  engineVersion: string; schemaVersion: number;
  input: SimulationInputSpec;
  settledSnapshot: SerializedModelState;   // ★ certified IC。捨てない（V&V 対象 & warm-restart 種）
  vvReportRef?: string;                     // V&V page への参照
  scalarSummary?: Record<string, number>;   // cache のみ（run 一覧 / launch thumbnail 用、canonical でない）
  createdAt: string;
  // ★ 波形 samples / 詳細 metric は保存しない → Reader が settledSnapshot から数 beat 前進して再生成
}

interface ExperimentRevision {       // immutable（全部を1箇所に束ねる）
  id: string; revision: number; projectId: string;
  model: { id: string; version: string };                 // ← pin（§2.3）
  engineVersion: string; schemaVersion: number;
  scenarios: { scenarioId: string; input: SimulationInputSpec; runId: string }[]; // ★ 複数 run を pin
  workingSet: ViewSpec[];                                  // catalog からの選択（graph/metric/control）
  boardLayout: BoardLayout;                                // fullscreen の graph 空間配置（= content, §4）
  brief: BriefSpec;                                        // inflow/peek。binding は explicit 解決済み（§6.7）
  vvReportRefs: string[];
  expectedFindings?: string[]; limitations?: string[]; validationProfileId?: string;
  provenance: { commandRange: [number, number] };          // どの command log 範囲で作られたか
}

interface ExperimentDraft { id: string; projectId: string; model: {id:string;version:string};
  /* baseRevision snapshot + append-only DomainCommand log で構成（§10.3） */ }

type CellPlacement = { experimentRef: { id: string; revision: number };
  inlineMode: "inflow" | "peek" | "launch"; localCaption?: string };

interface DocumentDraft { id: string; projectId: string;
  purpose: "lesson" | "article" | "lab-note"; blocks: DocumentBlock[]; }
interface PublishedDocumentRevision { documentId: string; revision: number;
  resolvedBlocks: DocumentBlock[];               // 全 CellPlacement を revision へ pin
  manifest: { publishedAt: string; experimentRevisions: Record<string, number>;
    pinnedRunIds: string[]; engineVersions: string[]; vvReportIds: string[] }; }

interface Project { id: string; title: string; ownerId?: string; kind: "official" | "personal"; }

// ---- ephemeral（永続しない） ----
interface SimulationSession { id: string; /* N 本の live session、transient patch、dirty */ }
interface WorkspaceState { /* pane 位置 / drawer 幅 / scroll / selected tab / extent */ }
```

**invariant(型では表せない、command handler が守る):**
1. `pinRun` は `settled === true` かつ `vvReport.verification` が全 pass の run のみ許可(validation は不問、§11)。
2. `materializeRevision` / `publish` は全 scenario が pinned run を持つときのみ成功 → **公開物は必ず certified snapshot に裏打ち**。
3. `brief` の control は materialize 時に binding を explicit 解決(§6.7)。
4. Session 由来の値は DomainCommand log に載らない(`forkToDraft` 経由で初めて Domain 化)。

### 2.6 v1 で持つ型と後で割る境界

- **v1 durable(最小)**:`RunArtifact` / `ExperimentDraft` + `ExperimentRevision` / `DocumentDraft` + `PublishedDocumentRevision` / 軽量 `Project`。
- **v1 ephemeral**:`SimulationSession` / `WorkspaceState`。
- **後で割る切れ目(v1 では暗黙)**:`Study` / `ScenarioRevision`。research / fitting / patient-data が来たら first-class 化。
- **非交渉(後回し不可)**:`ScenarioRevision` を独立オブジェクトにするのは後でよいが、**再現可能な `SimulationInputSpec` は v1 から必要**。曖昧参照 `scenarioRef: "normal"` を作らない(最低でも `{id,revision}` か完全 snapshot を Run に同梱)。

**理由:** 「Notebook/Cell に全部統一」も「Study/ScenarioRevision を最初から全部立てる」も別種の over-engineering。前者は「どこで作る」を再発、後者は概念過多で麻痺。**v1 は Run + Experiment + Document に絞り、将来割る境界だけ守る。**

---

## 3. Catalog → Working set → Brief:入れ子の足し算

### 3.1 3つの入れ子

```
Catalog（modelId/version が申告する全 signal/scalar/param）   … 潜在。誰も全部は見ない
   │  add（探索）   ← 誰でもやる。metadata を残さない
   ▼
Working set = workbench / fullscreen = 1 experiment           … author の探索セット（例: graph 27枚）
   │  pin + rank（オーサリング）   ← 任意。author のみ
   ▼
Brief = peek / inflow                                         … 読者向けの少数
```

各段は親から「足して」作られる。**引き算(全部から削る)は一度も発生しない。**

### 3.2 なぜ足し算で引き算でないか ★重要

「20個の param から4つを上位に sort」「27個の graph から23枚を隠す」が気持ち悪いのは**全部入りを起点に削るから**。削る方式は全要素に「残す/隠す/優先度」メタデータを持たせ、それが (a) category 並びと喧嘩、(b) workbench を星マークで汚す、(c) document を作らない臨床医に無意味。→ **方向の反転:引き算(hide)ではなく足し算(pin)。** 空の brief に working set から拾って入れる。23枚を隠す操作は存在しない。

### 3.3 2つの act(探索とオーサリングの分離)

- **Act 1 — Assemble(catalog → working set)**:「この experiment にどの graph/metric/param を存在させるか」。**探索。誰でもやる。metadata を残さない。**(workbench の graph を add/remove するのは*探索*であって正典を汚すオーサリングではない。)
- **Act 2 — Feature/Rank(working set → brief)**:「そのうちどれが最重要か」。**オーサリング。任意。author のみ。peek/inflow を作るときだけ。**

**臨床医は Act 1 で止まる**(working set を共有)。**author は Act 2 まで進む**。読者は brief(無ければ launch)を見る。

### 3.4 優先順位は「拾った少数」にだけ存在する ★重要

「20個から違う category の4つを上位 sort する気持ち悪さ」が消えるのは、**優先順位を全体(20個)ではなく拾った少数(3〜4個)にだけ持たせる**から。4つを並べ替えるのは自明に簡単。**fullscreen の category 並びは一切動かさない。**

---

## 4. Workbench(fullscreen)の構成

### 4.1 「全部見せの fullscreen」は存在しない(訂正)

初期は「fullscreen = 全部見せ・非オーサリング・自動配置の正典」としたが**誤り**。全 graph を最初から含めるのは attention 上も無理で、author は fullscreen でも絞りたい。正しくは **fullscreen も catalog からの「選択(working set)」であり、author が配置する**。「全部」は catalog にしか存在せず、どの extent も選択。§3 の入れ子はこの訂正を反映している。

### 4.2 spatial / non-spatial で要素を割る ★核心

「role area か free tile か」は**偽の二択**。空間的意味の有無で割ると解ける:

| 要素 | 空間的意味 | 扱い |
|---|---|---|
| **graph** | **有り**(RV=左, LV=右, 上下, 2×2 の位置が意味) | **author が置く board**(split / 自由配置)。**配置は content として保存** |
| **controller** | 無し(順序程度) | **inspector のリスト**。2D 配置しない |
| **metric** | 無し | **inspector のリスト / readout**。2D 配置しない |

**理由:** 祖先の全自由 tile が辛かったのは、20-param の scroll pane を graph tile の間に自由配置できたから ── **non-spatial に空間の自由を与えたのが失敗**。role area が正しかったのは「graph と controller を分けた」点、間違いは「graph 側まで固定 area にした」点。よって **graph は解放(author 配置)、controller/metric は inspector に固定**が両者の正しい合成。

### 4.3 graph board の配置は auto でなく author(= content)

- graph の空間配置は author の意図であり**保存すべき content**。**auto 生成してはいけない**。auto default は「新しく足した graph を末尾に置く」程度の弱い初期値。
- peek/inflow/mobile は workbench から**派生**するが、workbench 自身は派生元=canonical なので auto では決まらない(非対称で正しい)。

### 4.4 組織の最小単位は scenario でなく graph ★重要

- **graph = 「どの signal を、どの scenario 群を重ねて見るか」という1つの比較の定義。** normal + HFrEF の LV PV loop は「2つの scenario を重ねた1枚の graph」。
- よって **board を scenario で grouping しない**。board はフラットな author-placed graph tile の集合。**各 graph tile が独立に「重ねる scenario」を選ぶ**。
- **意味論サブグループも入れ子自由配置も不要。** 入れ子は発生しない。

### 4.5 パフォーマンスの真のコスト単位 ★誤解の訂正

- **graph / metric は sim 出力の射影**(PV loop も waveform も Guyton も energy も同じ状態ストリームから列を読むだけ)。
- **計算コスト ∝ 同時に live な scenario 数**。graph を増やしても計算はほぼ増えない。
- 増えるのは **描画コスト ∝ 画面に見えている live chart 数**。**他 tab の chart は描画されない**(tab 構造がそのまま描画予算の制御機構)。
- 結論:**workbench は graph が多くても大丈夫**(attention の問題であって perf ではない)。抑えるべきは**同時に live 積分している scenario branch の本数**。

### 4.6 recursive split vs recipe(矛盾の解消)

「再帰的 composition tree を却下」と言ったのは *brief presentation* の話(§6 は recipe/cutoff)。**graph board 自身は recursive split tree でよい**(explore の自由)。両者は別レイヤーで矛盾しない。

---

## 5. Controller / Scenario / Custom pane

### 5.1 controller は scenario を所有せず scenario manager への inspector(現状は正しい)

1. **scenario = 名前つきの入力値セット(branch)。controller = 値を変える UI。** N 個の scenario がそれぞれ値を持つのに単一 controller が N 個分を所有できない → controller は「今 active な scenario の値」への**束縛 view** であるしかない。
2. controller が値を所有すると scenario と controller の値が**二重化して desync**。
3. アプリ全体の **durable data(scenario)vs ephemeral view(controller)** 分離そのもの。

### 5.2 束縛 scope(唯一の機能追加)

```ts
interface ControlBinding {
  targets: { kind: "active" } | { kind: "visible" } | { kind: "scenarios"; scenarioIds: string[] };
  application: "absolute" | "delta" | "intervention";
}
```

- **既定:active scenario に auto-bind**。任意・主導で特定 scenario subset に bind できる。
- 例:「HFrEF の Ees」は HFrEF に bind、「両方の HR」は `all`。application を `delta` にすれば「normal と HFrEF を同時に +10 bpm」。
- これで **dual-scenario 同時操作**(公平比較)が解ける。

### 5.3 dual-scenario 制御に free tile は要らない ★重要な untangle

「2 scenario を同時操作 → 自由 tile で scenario-bound controller × 2 を置きたい」は**束縛問題をレイアウト問題と誤認**。実際は inspector に **scenario-scoped の controller group を2つ持つ**だけ(§5.2)。**free tile に惹かれた唯一の実需が束縛で解けるので、free tile 導入の理由が消える。**

### 5.4 custom graph / metrics / controller は1つの primitive

根源的に同じ:**catalog の1名前空間(signal / scalar / param)から順序つきで選んだ選択 + 提示方法**。

| 呼び名 | 選ぶ対象 | 提示 |
|---|---|---|
| custom graph | signals | plot(waveform / loop / curve / bar) |
| custom metric set | scalars | 数値 readout |
| custom controller | params | control widget |

- **"custom" は特別モードでなく全 pane の本質**(全 pane が「編集可能な選択」)。
- **重い儀式にしない**:「custom controller を新規作成」でなく「knob をドラッグで足す」が既定。名前を付けて保存は再利用のための任意。

### 5.5 custom button(label + preset)は control affordance の一種(支持)

- 「輸液500ml」ボタンは beginner/教育で raw slider より圧倒的に良い。
- control の affordance は1種類でない:連続入力(slider)/ 離散アクション(button → preset)/ toggle / step。
- 「輸液ボタン」は瞬時 value 代入でなく **rate/ramp 介入**であるべき → `TransitionPolicy`(§2.4)と直結。
- **control spec は「どの param」だけでなく「どの affordance で、どの transition policy で」を持つ。**

### 5.6 「介入 onset の生理学的正確さ」と「表示 1×」は別概念

- contractility slider を瞬時に変えるのは「dobutamine が薬物動態に従って効いた」でなく「収縮性 param への step perturbation」。
- 将来的に UI で区別:`Contractility — instantaneous model perturbation` と `Dobutamine — effect ramp 30 sec`。
- **v1 は step perturbation で十分**。ただし「生理時間 1×」と「介入 onset の生理学的正確さ」は別物として残す。

---

## 6. Brief オーサリング UX

### 6.1 モデル:pin して作る、workbench には痕跡を残さない

- brief = workbench の graph/metric/controller から **pin + rank した順序つき選択**。
- **compose layer** として workbench 上に一時的に重ねる。**pin の結果は Experiment(Draft)に保存され、workbench には痕跡を残さない**(→ 臨床医の workbench は星ゼロ)。
- **星マークという設計をしない。** 優先度は「拾った brief の中の順序」としてのみ存在し、workbench 要素はメタデータを持たない。

### 6.2 pin は参照でなくコピー(snapshot)★

brief に graph を pin したとき、それは **view spec の snapshot コピー**(参照ではない)。author が後で board の graph を編集しても brief は追随しない(immutability の一貫性)。「brief を更新する」は明示アクション。理由:参照にすると workbench の探索的編集が公開 brief を勝手に動かし、pin の意味(certified な確定)が崩れる。

### 6.3 具体的操作

1. author が cell を fullscreen で見ている。上部に「Compose brief」トグル。**臨床医は押さない。**
2. 入ると右(or 下)に **Brief パネル**が dock し、**inflow と peek のライブプレビュー**。workbench の各要素に hover で「+ pin」。
3. graph の「+」→ 要素が Brief プレビューへ**飛ぶ**(shared-element)。metric は個別クリックで metric 行、knob は exposed set へ。
4. Brief パネル内で**ドラッグして並べ替え = 優先順位**。
5. プレビューを inflow ↔ peek で toggle して両方確認。
6. Compose を抜けると **workbench は見た目まったく元通り**(痕跡なし)。brief は Experiment に保存。

- **Brief トレイは tab 切り替え・scroll をまたいで保持**(複数 tab / category から拾える)。

### 6.4 inflow / peek を別々に作らない:1つの brief の cutoff 違い(ただし per-extent 上書き可)

author は**優先順位つきの1つの brief**を作る。extent はその brief の**上位いくつを見せるかの cutoff**:

| extent | graph | metric | knob | 作られ方 |
|---|---|---|---|---|
| inflow | 上位1 | 上位2〜4 | 上位1〜2 | brief の cutoff |
| peek | 上位2〜4 | 上位6〜8 | 上位3〜4 | brief の cutoff(+ 必要なら peek 固有の 2×2 配置を上書き) |
| fullscreen | 全部 | 全部(category) | 全部(category) | author 配置(§4) |

- **矛盾の解消:** 「ranked cutoff だけ」と「peek で 2×2 自由配置」は両立する。brief は per-extent の presentation を持ち、既定は peek が inflow を継承、**必要時だけ peek 側の配置/内容を上書き**。
- 読者側でどの extent を出すかは document 配置ごとの `inlineMode`(inflow/peek/launch)か responsive(mobile→inflow, desktop→peek)。

### 6.5 3×3×3 の worked example

graph が 3列 × 3行 × 3tab で peek に (0,0,0),(1,2,1),(1,2,2),(2,2,2) を出したい:Compose に入り、tab0 で (0,0,0)「+」→ tab1 で (1,2,1)(1,2,2)「+」→ tab2 で (2,2,2)「+」→ Brief に4つ揃い 2×2 にドラッグ配置。**4クリック + 配置**。23枚を隠す操作も優先度番号も無い。他は無傷。

### 6.6 metrics / params も同じ足し算

- **20個の param controller は fullscreen で category ごとに並んだまま一切動かさない。** peek/inflow には expose したい3〜4個を pin するだけ。
- metric も同様(SV / CO / O₂ delivery / EF を別 category から拾っても fullscreen の並びは無傷)。
- これは既存の **exposedKnobs(EK-1 / EK-2)と同じ思想**(「全部を優先度 sort」でなく「少数を expose」)。新発明でなく延長。

### 6.7 brief 化 = Lab 相対の参照を explicit に解決(binding freeze)★

**Reader には「active scenario」概念が存在しない。** brief である graph が scenario1/2/3 を重ねているとき、slider を渡しても「どれが動くか」が Lab 的な active では決まらない。よって **materialize 時に binding を explicit に freeze する**:各 controller は「特定 scenario に bind」「all に bind」「scenario ごとに分ける」のどれかに解決される(Lab 既定 active → explicit)。

**一般化:** brief materialization は「Lab 相対の参照を全部 explicit に解決する」工程で、**publishDocument が ref を revision に解決するのと同じ構造**(brief 時解決 : Lab = publish 時解決 : Document)。binding default も文脈依存:Lab=active、Brief=explicit 必須。

### 6.8 brief 未作成時のデフォルト

brief を author しなかった cell は document 内で **launch tier**(pinned Run の静止プレビュー + 開くボタン)で出る。launch thumbnail は `brief.primary` の既定 graph(未指定なら working set の先頭)。オーサリング量が単調(何もしない=launch、少し pin=inflow、もっと=peek)で臨床医はゼロのまま破綻しない。

---

## 7. IA / surface / ユーザー別導線

### 7.1 surface は実質1つ(document canvas)。トップは目的で3入口

```
CircleHeart
  学ぶ Learn       公式 document を読む・触る（beginner 主導線）
  症例 Cases       症例 / 介入から n=1 cell を即開く（臨床家 主導線）
  自分の Projects  作った document / experiment / run（author・研究者）
```

- **Investigate という独立 surface は無い**。「調べたい」= 空 document を新規作成して1個目の cell をその問いで開く動作に畳む。
- **Study Lab / Experiment Editor という独立 destination も無い**。それは「cell を fullscreen / compose に開いた状態」。
- **note pane は廃止**(§9)。文章は document の text block。

> **命名の注意(矛盾の解消):** 「Study Lab」「Experiment Editor」という語は本ドキュメントで surface 名として便宜的に使うが、実装上は独立 destination ではなく「cell を fullscreen で開いた状態(Study Lab)」「その上の compose layer(Experiment Editor)」を指す。

### 7.2 role は surface を変えず「初期状態」と「密度の天井」を変える

| role | cell の初期状態 | Capability の天井 | text / outline chrome |
|---|---|---|---|
| beginner | inflow・作者が絞った数個の knob | interact(compose 不可、raw param/solver 出ない) | 隠す(読み物に見える) |
| 臨床家 | inflow ですぐ触れる / Cases からは即 fullscreen | interact〜compose | 必要時のみ |
| author・研究者 | inflow、fullscreen で全 knob / branch / run 表 | compose(青天井) | 表示(document 意識) |

- **ペルソナで画面を分けない**(beginner が成長しても引っ越し不要、臨床家が教えるとき author に地続き)。§1.1 の Capability 軸がこれを担う(fullscreen ≠ compose 権限)。

### 7.3 使い捨て臨床医(document を作らない人)の導線 ★重要

```
Cases「RV failure」→「触ってみる」   or   Home「新しいシミュレーション」
  → 1個の cell がいきなり fullscreen で開く（＝昔の workbench 1枚, Context=scratch）
  → knob・graph・branch を触って完結。text 不要・2個目の cell 不要
  → 使い捨て：閉じれば消える
  分岐: 「Experiment として保存」/「figure 書き出し」/「document に追加」（初めて n≥2）
```

- 本人に「document」という語は見せない。**単一 cell workbench = document の退化形(n=1・text 無し)**。chrome を隠すだけで別の仕組みは作らない。

### 7.4 状態の連続性(最重要の UX 資産)

```
公式 baseline(pinned) → 触る → Your trial(live 1×) → Reset(pinned へ) / Focus(同 Session 維持) / Labで続ける(Project へ fork)
```

ラベルで常に状態を明示:`公式・pinned` / `あなたの試行・未保存` / `beat 4 後・approaching` / `steady verified`。**spinner にしない**(過渡は待ち時間でなく観察対象)。

### 7.5 AI の置き場所(IA に明記)

- **常設 pane にしない。global command bar(⌘K)+ contextual action + 必要時の typed-proposal drawer。**
- AI 出力 = `DomainCommand[]` 提案 → 人間語 diff → validate → apply(§10.5)。AI が layout/param を直接書き換えない。
- **v1 では skip(§16)**。ただし command 層はこれを前提に設計する(§10, §11)。

### 7.6 ユーザー別導線(確定版)

- **beginner**:学ぶ → 公式 document → 読む → cell を inflow で少し触る → full-width で深掘り →(任意)quiz。raw param/solver/graph 追加は天井で出ない。
- **臨床家(使い捨て)**:§7.3。document を意識しない。
- **author**:Projects → 空 document → text と cell を足す → cell を fullscreen で作り込み → Compose で brief(binding freeze)→ inflow/peek/mobile プレビュー → Publish Review(validationProfile)→ Published revision。
- **研究者**:Projects → run 表(exact 値・input hash・validation report・CSV/Parquet)→ 気になる run を cell fullscreen(内側で自由配置)で解析 → Experiment / figure / EvidenceBundle export。外部 Claude/ChatGPT から MCP で run 作成・比較・artifact 取得(公開は first-party review を通す)。

---

## 8. Runtime(前景 live 1× / 背景 strict verifier / multi-scenario)

> **訂正(revision 2):** 旧記述の「engine 変更ゼロ・不確実性ゼロ」は撤回する。数理 engine・state serialization・背景 steady・validation 連動は**資産として再利用**できるが、runtime の orchestration には変更が要る(§8.3 の自動 promote 除去、§8.4 の multi-scenario 化、任意 Run からの warm-restart は**要 spike 検証**)。

### 8.1 時間スケールの結論 ★

- **表示は 1× 生理時間。計算だけ背景で高速。**
- 加速表示(数十倍速)は **HR 変化に誤認**され、一番大事な「波形の形」を歪める。分けるべき3つ:① 生理シミュレーション時間 ② 数値計算速度 ③ 表示・再生速度。②が 20〜35倍でも③を 20〜35倍にしない。

### 8.2 二重経路(単一 scenario の基本形)

```
                     ┌─ Foreground live session … 生理実時間 1×、過渡応答をそのまま表示
Pinned steady state ─┤
                     └─ Background verifier      … 表示なし、可能な限り高速、厳密 steady-state gate
```

- **前景**:slider を触った瞬間から現在状態を IC に連続積分。介入 marker、PV loop は過去数 beat を薄く残す、baseline ghost、metric は「最後に完了した beat」から。5〜6 loop で approaching(緩い beat-to-beat 判定 Live→Approaching→Near steady、これは表示上の状態で科学的収束判定ではない)。
- **背景**:pointer up / 300ms debounce 後、同じ最終 param で別 worker が厳密収束。slider 再操作で古い job は破棄。

### 8.3 verified steady へ自動ジャンプしない(現行コードの訂正)

- **現行実装は steady 完了時に自動 promote しているが、本設計はこれを禁止する。** 過渡が切れ・波形 jump・位相変化・何が起きたか不明になる。
- 代わりに「Verified steady available(CO 3.4 / CVP 14)[Verified steady へ移動]」を出し、**押したときだけ次の beat 境界で phase alignment して移動**。
- 役割分担:**Live transition = 理解のための表示 / Verified steady = 信頼できる最終数値と保存**。

### 8.4 multi-scenario live transition ★新設・中核

**Ees の baseline vs HFrEF はこれ。** §4.4 の「1 graph に複数 scenario を重ねる」を組織の中心に据えた以上、runtime は単数前提ではいけない。

```
Experiment.scenarios = [normal, HFrEF]
  → 各 scenario の pinned Run の settledSnapshot から、N 本の foreground live session を同時に温間再開
  → 同一 graph に 1× 生理時間で重ねて描画（normal 青・HFrEF コーラル）
  → 共有 knob（HR, binding=all）を動かすと N 本すべてに patch 適用、N 本が同時に過渡
  → background verifier も N 本、strict で収束 gate（画面に出さない）
```

- コスト ∝ **同時 live な scenario 本数**(graph 枚数でない、§4.5)。これが本製品で最も高い場面であり中核ユースケース。
- reset は N 本すべて pinned baseline へ。metric は各 scenario の beat 完了単位。

### 8.5 StateSnapshot と warm restart

- warm restart に必要なのは表示画像でなく**内部状態**。既存 `SerializedModelState`(schema version / model version / state layout hash / parameter hash / time / phase / 全状態ベクトル x / TBV anchor)がすでに基盤。
- 必要なのは「full state を一から作る」ことでなく、これを Run に紐づける上位 wrapper `LiveSessionSeed`:
  ```ts
  type LiveSessionSeed = {
    sourceRunId: string;
    input: SimulationInputSpec;
    modelState: SerializedModelState;
    auxiliaryRuntimeState?: { activeProviderStates?: unknown; interventionStates?: unknown };
    displaySeed: { lastBeatSamples: SimSample[]; metrics: SimMetrics; health: SimulationHealth };
  };
  ```
- 3種類の連続性を分ける:**ODE 状態**(`SerializedModelState`)/ **表示**(最後の一心拍の sample buffer を同梱し後ろへ live sample を追加)/ **metrics**(beat accumulator を serialize するか、restart 後最初の一心拍を「集計中」表示)。
- 注意:現 state contract では TBV projector の一部 counter は非 serialize。よって `SerializedModelState` 単体を「完全 snapshot」と呼ばず `LiveSessionSeed` の一部として扱う。

### 8.6 V&V を実行から疎結合化 ★

3つの「検証」を分離する(混同しない):

| 種類 | 内容 | どこで走るか |
|---|---|---|
| **(A) 完全 V&V** | morphology / conservation / validationProfile 照合。**重い** | **author の compose/pin 時のみ**。Reader では走らせない |
| **(B) 背景 steady verifier** | 数値収束の判定のみ。軽め | どこでも可・advisory(「verified steady available」)。読者探索用・非公開 |
| **(C) Reader baseline** | pin 済み certified snapshot を IC にするだけ | Reader は V&V を**一切計算しない**(毎回 settled state が保証) |

- **pin ルール:pin できるのは「steady ∧ (A) verification 通過」の working set のみ。verification は必須、validation は症例依存で範囲内である必要なし**(異常症例が主眼)。
- Reader が slider を触った後の状態は certified を外れた「your trial・unverified」。verified steady が欲しければ (B) を回すが非権威・非公開。
- これで **全公開 brief は certified snapshot に裏打ちされ、Reader は V&V ゼロ**。

### 8.7 density = 性能予算のダイヤル

- in-flow で未操作 / 画面外の cell = `compact`(engine 停止・pinned 静止画)。expand or 操作で `live` 化。
- **IntersectionObserver で積分ごと停止 / 再開**(描画停止では不足)。「同時 live な scenario 本数」を制御すれば mobile でも死なない(§4.5, §8.4)。

### 8.8 worker protocol の分離

`setInstances`(構造変更・cold start)/ `updateInstanceTargets`(slider・live-safe、core 再生成せず現在状態から継続)/ `verifySteady` に分離。custom controller や AI も catalog から transition policy(live-safe か / restart 必要か / 単位・範囲)を取得し勝手に決めない(§2.4, §11)。

### 8.9 再生速度の最終方針

| surface | 方針 |
|---|---|
| Inline Experiment | 1× 固定・speed control なし・Reset・Verified steady へ移動 |
| Focus Experiment | 原則 1×・pause のみ・複雑教材で 0.5× 許可・自動加速なし |
| Study Lab(fullscreen) | 0.5× / 1× / 2× 明示選択可・常に `Playback 2×` 表示・研究者はさらに高速可 |
| Background verification | 常に最速・ユーザー再生速度と無関係 |

---

## 9. Document editor(note を吸収した新規の器)

- **「note pane をベースに作る」は発想が逆。** note pane はテキスト入力欄で、document(text block と cell block が交互に流れ、cell は Experiment への `CellPlacement` 参照)とは別物。
- 正しい関係:note の「テキストを書く」能力 → document の text block に吸収。document editor 本体(block 列 / cell 参照 / compose 呼び出し / publish)→ **新規**。使い捨て臨床医 → **n=1・text 無しの document = ただの workbench 1枚**(保存すると裏で n=1 document になる)。
- **note は document に溶けて消える。**
- text は cell の**兄弟 block**(地の文・章のつながり・cell をまたぐ考察・結論)。cell 固有の短い注記(question / expected findings / control の意味 / limitation / graph の読み方)は **Experiment 内**(cell を別 document へ移しても一緒についてくるべきだから)。
- block 種:`text / heading / equation / citation / callout / quiz / experiment(CellPlacement) / figure / table / model-limitation / learning-objective`。
- **quiz は任意 block**。全 experiment に predict → manipulate → reveal を強制しない(専門書・reference article では不自然。循環器専門医の専門書に quiz は無い)。beginner 向け lesson で必要な箇所だけ。
- quiz でない通常の可視化機能 **baseline ghost / intervention marker / delta / reset** は対象レベルを問わず有益なので experiment の表示 option(pedagogy でなく良い viz)。
- **canonical は BlockNote 内部形式にしない**(ADR-STUDIO-001 を継承)。canonical は typed block JSON。BlockNote/Markdown は入力・export・AI authoring・review 用。

---

## 10. Command 層 / event-source / versioning

### 10.1 直感の評価

「workbench も widget も command の stack で作られ、それが自然に versioning になる」は **8割正しく、1割が罠、残りが最大の価値**。

### 10.2 command を2種に割る ★核心

```ts
DomainCommand   // durable・検証・永続・versioned
  project.create / experimentDraft.create(model)
  experimentDraft.addScenario(SimulationInputSpec)
  experimentDraft.addView / setViewStyle / setBoardLayout
  experimentDraft.setControlBinding / setBrief
  run.requestSettle → RunArtifact / run.requestVerify → VVReport
  experimentDraft.pinRun（前提: steady ∧ verification passed）
  experimentDraft.materializeRevision → ExperimentRevision(immutable)
  documentDraft.insertBlock / updateBlock / publish → PublishedDocumentRevision

SessionCommand  // ephemeral・非永続・live engine を駆動（log に載らない）
  session.openFromRun(runId) / applyControlPatch(id,value)   ← slider
  session.setScenarioBinding / reset / requestVerifiedSteady
  session.promoteVerifiedSteady（明示・beat 境界 phase 合わせ）
  session.suspend / resume / forkToDraft（← ここで DomainCommand を発行）
```

- **罠:** slider を versioned stack に積むと1ドラッグで数百 event で窒息。**widget を駆動するのは SessionCommand(捨てる)、cell/document を作るのは DomainCommand(残す)。** live の過渡は path-dependent な探索なので **canonical にしない**。canonical は pinned steady Run のみ。

### 10.3 versioning の正体:log と snapshot を混同しない ★核心

純 event-sourcing(log だけ保存し常に replay)は、**engine/schema 更新で過去 log が replay 不能で壊れる**古典的罠。Run が採る「参照でなく snapshot で固定」と同じ思想で回避:

```
ExperimentDraft = baseRevision の snapshot + 以降の DomainCommand log(append-only)
ExperimentRevision(immutable) = materialize した状態 snapshot + provenance + 解決済み pinned run id + engine/schema version
```

- **snapshot = 「それが何か」→ 再現性・pin。公開物は snapshot で固定し、log の replay で復元しない。**
- **command log = 「どうそうなったか」→ diff・履歴・undo・AI の提案単位。**
- **undo は log を pop しない(矛盾の解消):** log は append-only。undo は **compensating command を追記**するか、session 内の非永続な戻し。「pop する」という表現は撤回。

### 10.4 Experiment Draft と Revision(所有問題の解消)

```
Project
├─ ExperimentDraft        mutable   … Study Lab / Document Editor どちらの drawer からも開ける
├─ ExperimentRevision 1   immutable
└─ ExperimentRevision 2   immutable
```

- **Revision は immutable。共有・編集するのは Draft。** 保存時に新 Revision を生成。公開 document が Revision 1 を参照していれば Revision 2 ができても自動更新しない(「新しい revision が出た [差分を見る][revision 2 へ更新]」)。
- Experiment Editor は独立 destination でなく **Study Lab / Document Editor 両方から開ける共有 drawer + expandable full-screen**。**Project が Experiment を所有し、drawer は共有 Draft を編集する view にすぎない**ので所有問題は起きない。

### 10.5 この層が効くところ

1. **単一 write path**:UI・埋込 LLM・MCP・CLI が全部 `dispatch(command)` のクライアント。
2. **AI = DomainCommand[] の提案者**:提案 command 列 → diff(人間語化)→ validate → apply。AI が直接書き換えない(typed proposal)。
3. **MCP** = DomainCommand / Query の厳選サブセットに 1:1。read + 安全 write(run/compare/export)開放、publish 等は first-party review で gate。`add_tile` のような UI 操作は露出しない。
4. **revision diff / 「revision 2 が出た」通知**が自動で出る。
5. **undo/redo** = 同一 session 内で(§10.3 の compensating で)。跨 engine replay は罠なので避ける。

### 10.6 Query / Event

`getCatalog / getRun / getExperimentRevision / compareRuns / diffRevisions / getVVReport`(Query)、`run.completed / verifiedSteady.available / vv.completed / revision.created / document.published`(Event)。UI は Event を購読し背景 verifier 結果等を反映。

### 10.7 作る順序

汎用 command bus を最初に全部設計しない(platform-first の罠)。**最初の vertical slice に要る command だけ型付き関数で作り、2本目を通した時点で共通部を Application API に固定**、同じ API を MCP/CLI に露出(§11.5)。

---

## 11. Presentation ↔ Engine 疎結合(port / interface 設計)★新設

### 11.0 目的(何のための疎結合か)

抽象的な綺麗さではなく、次の4つを満たすため:① engine が別 lane で進化し続ける(coronary/support/rhythm)のを presentation を巻き込まず差し替え・追加。② 同じ command を UI/LLM/MCP/CLI から叩く(単一 write path)。③ worker/別プロセス/将来サーバで engine を回す。④ V&V が重いので実行経路と独立に呼べる・キャッシュできる。

### 11.1 疎結合すべき境界は1本でなく3本

```
Presentation ──①──▶ Application(Command/Query/Event) ──②──▶ Engine ports(interface) ◀──③── Engine/V&V impl
  知ってよい: Contract 型 + Application API のみ
  知ってはいけない: Engine 内部型(SimInstance/core/provider…)、solver、V&V アルゴリズム
```

矢印はコンパイル時依存の向き。**engine は port を*実装する*(依存が内向き)。presentation は engine を import できない。この一方向性を破る import が1つでもあれば疎結合は崩れる ── レビューで見るのはそこ。**「presentation ↔ engine を直接疎結合に」ではなく、**間に Application/Command 層を噛ませ、両方をそこに対してだけ結合させる三者構造**が正解。

### 11.2 Contract 型(境界を越えてよい"値")

原則:**port/command を越える型は worker postMessage・MCP JSON・ファイル保存をそのまま通せる plain serializable のみ**。関数・クラス・engine 参照は越えない。engine 内部状態は `auxRuntimeState` として**不透明**にし、engine だけが解釈する(→ engine の進化が型として漏れない)。

```ts
type ModelId = string; type ModelVersion = string;
type EngineVersion = string; type SchemaVersion = number;

interface SimulationInputSpec {
  schemaVersion: SchemaVersion;
  model: { id: ModelId; version: ModelVersion };
  engineVersion: EngineVersion;
  clinicalKnobs?: Record<string, number | boolean>;
  parameterPatch?: Record<string, number>;
  interventions?: InterventionSpec[];
  solver: SolverConfig;
  settlePolicy: SettlePolicy;
}
interface InterventionSpec { paramPath: string; policy: TransitionPolicy; value: number; atSimTime?: number; }

interface SerializedModelState {
  schemaVersion: SchemaVersion; modelVersion: ModelVersion;
  stateLayoutHash: string; parameterHash: string;
  simTime: number; phase: number;
  x: Float64Array | number[]; tbvAnchor: number;
  auxRuntimeState?: Record<string, unknown>;   // 不透明（engine のみ解釈）
}

interface SimSample { t: number; signals: Record<string, number>; }
interface MetricValue { key: string; value: number | null; unit?: string; beatComplete: boolean; }
interface SimulationHealth { settled: boolean; converged: boolean; warnings: string[]; }

interface CatalogManifest {
  model: { id: ModelId; version: ModelVersion }; engineVersion: EngineVersion;
  signals: CatalogSignal[]; metrics: CatalogMetric[]; params: CatalogParam[];
  graphTypes: CatalogGraphType[]; interventions: CatalogIntervention[];
  capabilities: string[];   // "coronary" | "mechanical-support" | "rhythm" …（存在申告のみ）
}
interface CatalogParam {
  key: string; unit: string; range: [number, number]; category: string;
  defaultTransition: TransitionPolicy;   // §2.4
  transitionLocked: boolean;             // true = author 上書き不可（物理強制）
  affordances: ("slider" | "button" | "toggle" | "stepper")[];
}

interface VVReport {
  reportId: string; snapshotHash: string; profileId: string;
  verification: GateResult[];   // 必須。全 pass でないと pin 不可
  validation:   GateResult[];   // advisory。症例依存、範囲外でも可
  createdAt: string;
}
interface GateResult { gate: string; status: "pass" | "fail" | "advisory"; detail?: string; }
```

### 11.3 Engine ports(実行と検証を割る = V&V 疎結合の核心)

```ts
// catalog は独立 port（実行なしで引ける・キャッシュ可）
interface CatalogPort {
  listModels(): Promise<{ id: ModelId; version: ModelVersion }[]>;
  getManifest(model: { id: ModelId; version: ModelVersion }): Promise<CatalogManifest>;
}

// 実行（Reader も author も使う。V&V を呼ばない軽い経路）
interface SimulationPort {
  settle(input: SimulationInputSpec): Promise<{ snapshot: SerializedModelState; health: SimulationHealth }>;
  openSession(seed: { input: SimulationInputSpec; snapshot: SerializedModelState }): Promise<SessionHandle>;
}
interface SessionHandle {
  readonly id: string;
  applyPatch(paramKey: string, value: number, policy?: TransitionPolicy): void; // slider
  stepLive(dtWallSec: number): void;                       // 前景 1× 生理時間（加速しない）
  onSamples(cb: (batch: SimSample[]) => void): Unsubscribe;
  onMetrics(cb: (m: MetricValue[]) => void): Unsubscribe;  // beat 完了単位
  serialize(): Promise<SerializedModelState>;              // fork / verify 用の種
  suspend(): void; resume(): void;                         // offscreen で積分停止/再開
  dispose(): void;
}

// 検証（重い・独立・純関数的・キャッシュ可）
interface VerificationPort {
  verify(args: { input: SimulationInputSpec; snapshot: SerializedModelState; profileId: string }): Promise<VVReport>;
}
```

設計要点:
- **`verify` は session を受け取らない。snapshot と profile だけ。** これで V&V が「実行の副作用」でなく「値への問い合わせ」になり、キャッシュ・別プロセス・後追い実行が成立する(§8.6)。
- **背景 strict steady verifier(読者用 advisory 収束判定)は SimulationPort 側**(`settle` の亜種)で、VerificationPort(重い完全 V&V)とは別物。
- **自動 promote は port に無い。** verified steady が出ても Event で通知するだけ、切替は明示 command(§8.3, §10.2)。

### 11.4 engine には event-sourcing を持ち込まない ★

event-sourcing を効かせるのは **Application 層(Experiment/Document の編集)だけ**。engine の数値実行に log replay を持ち込むと engine 版更新で壊れる。

```
編集(durable, versioned) : Command log(append-only) + materialized snapshot   ← event-sourcing 的
数値実行(reproducible)    : SimulationInputSpec + settledSnapshot を "値" で固定  ← snapshot 的、log でない
```

**engine は log を持たず、入力と出力 snapshot を"値"で受け渡す純粋な変換器(stateless)。** engine が履歴・版・intent を知り始めた瞬間、presentation の editing 概念が engine に漏れる。Command/Event は境界①の接着剤に限定する。

### 11.5 transport 非依存(同じ interface が in-proc / worker / MCP を通る)

```ts
class InProcSimulation  implements SimulationPort {}   // v0：同一スレッド
class WorkerSimulation  implements SimulationPort {}   // postMessage、契約は同一
class RemoteSimulation  implements SimulationPort {}   // 将来 server、契約は同一
// MCP は QueryApi + 安全な DomainCommand サブセットに 1:1（publish は露出しない、§10.5）
```

**線(port interface)は今引く。距離(in-proc → worker → server)は後で伸ばす** ── contract が serializable な限り no-op で移せる。最初から分散させない。

### 11.6 疎結合が崩れる唯一の原因と防止

疎結合が崩れる原因はほぼ1つ:**presentation が engine 内部型を import すること**。防止策:port I/O を Contract 型(§11.2)だけに絞る / `auxRuntimeState` を不透明化 / **catalog を値(manifest)で渡す**。後者により presentation は `if (coronary)` を書かず、catalog に coronary graph が「有るか無いか」をデータとして描画する(engine 機能追加が presentation コード変更ゼロで通る)。

---

## 12. 公開と検証(publish / validation)

- publish = モード切替でなく「document の全 cell の run を pin して immutable revision を materialize」1操作。**作る場所と読む場所が同じ**なので、公開 = この連続体のこの瞬間を凍結。
- Publish gate は固定順(health > steady > morphology)を**持たない**。cell / case が `validationProfileId` を参照:
  ```ts
  type ValidationProfile = { requiredGates: string[]; advisoryGates: string[]; publicationPolicy: string };
  ```
  - 正常波形 → morphology 重視 / 弁疾患 → gradient + regurgitant fraction + morphology / Ca 感受性 curve → monotonicity + range + source equation / research fitting → residual + identifiability + UQ。
- **morphology(波形の形)を health / normal-range の下位に置かない**(製品原則:波形の形 > metric 値、異常症例が主眼なので正常範囲外で health が warn してはいけない)。
- 重い完全 V&V(A)は author の compose/pin 時に1回。既存 **verification/validation page** と連動(§8.6, §11.3 VerificationPort)。Publish Review はその report を表示するだけ。
- engine 更新後も公開 revision は自動差替えせず「再検証する」を出す(§2.3 の model migration と同型)。

### Publish Review UI(例)
Content(タイトル / 対象読者 / 学習目標 / 読了時間)・Experiments(revision 固定 / run 固定 / input snapshot 保存 / reset 確認)・Scientific status(validationProfile の report)・Safety(model limitations / not medical advice / clinical caveats)・Evidence(citations resolved)・Presentation(desktop / mobile preview / keyboard / chart text summary)。

---

## 13. Mobile 戦略

- **content と layout を分けて考える**:layout(2×2 の空間的意味)は phone では生存不可能 → 諦める。content(9枚全部・20 param 全部)は保存 → 空間でなく**逐次(tab/swipe)でページング**。「1枚に畳む」でなく「working set を全部保持したままめくる」。
- 現状の「split を flatten して横 scroll」は方向として正しい。ただし**減らさずページングする**。
- mobile の2文脈:**reader on mobile** → brief(inflow/peek の full-screen sheet)/ **explorer on mobile** → working set 全部を swipe ページング。分岐は role でなく **reader 文脈(document 内)か explorer 文脈(workbench 直)か**。

| 機能 | Mobile |
|---|---|
| Article 閲覧 / Inline Experiment | 完全対応 |
| Focus(Peek)Experiment | full-screen sheet 対応 |
| 限定的 Investigate / Experiment review | 対応 |
| Study Lab | 簡易表示(headline metrics 上・graph タブ切替・Controls bottom sheet) |
| 複雑な Experiment 構成 / batch / fitting / 自由配置 | desktop 推奨 |

---

## 14. Motion / design craft(Apple / Emil 準拠)

expand / collapse の空間連続性が**このプロダクトの craft の中心**。雑だと「全部入りで散らかった画面」に堕ちる。

| 項目 | 値 | 理由 |
|---|---|---|
| 展開 transition | shared-element:cell が流れ上の自分の位置から拡大して出る | 「どこから来たか」を身体で覚える |
| easing | `cubic-bezier(0.32,0.72,0,1)`(iOS drawer)/ enter ~350ms | ease-in 禁止(遅く感じる) |
| collapse | ~200ms、enter より速く、必ず元位置へ縮んで戻る | 応答は snappy・空間記憶を保つ |
| document 所属 cell を fullscreen 化時 | 上端に薄い breadcrumb `‹ RV failure · 3/7` + 画面端に document minimap | 「流れの一部」を条件付きで示す |
| n=1 scratch 時 | 何も出さない(流れが無い) | 信号は必要な時だけ |
| dismiss | drag + velocity>0.11 | 距離閾値だけにしない |
| `⌘K` 等キーボード操作 | 無アニメ | 高頻度動作を遅く感じさせない |
| ボタン | `:active` scale(0.97) 160ms | 応答フィードバック |
| pin | 「+」→ Brief へ fly(shared-element) | "そこへ入った" を見せる |
| slider → live | 値自体はアニメしない(1× 実データ描画) | 波形は連続描画、baseline ghost / marker |

- 原則:**戻り先を常に感じさせる**。「流れの一部」信号は **document がある時だけ**(使い捨て臨床医 n=1 には出さない)。`prefers-reduced-motion` で移動系を落とし opacity/色は残す。

---

## 15. ライブラリ選定

既存資産(React + TS / engine / chart renderer / CDS トークン / dockview)据え置き。presentation 層に足すもの:

| 用途 | 選定 | 備考 |
|---|---|---|
| headless primitives(dialog/popover/tabs/select/tooltip) | **Base UI** | origin-aware(`var(--transform-origin)`) |
| expand/peek・mobile sheet・detent | **Vaul** | gesture / momentum / snap |
| shared-element expand transition | **Motion(Framer)** | layout animation |
| toast | **Sonner** | 良 defaults・中断可 transition |
| document block editor | **BlockNote**(Tiptap 基盤) | custom cell block を載せやすい。canonical は typed JSON(§9) |
| fullscreen cell 内の自由配置(研究者) | 既存 **dockview** を **cell の中だけ**で再利用 | document 全体は縦流れ |
| chart | **既存自作 renderer** | 資産・swap しない |

- **Reader / inline / document canvas に dockview を使わない**。dockview は fullscreen cell の内側専用に降格。

---

## 16. 変更範囲(scope)と規模感

| 対象 | 作業 | 規模 |
|---|---|---|
| engine 数理 / graph renderer / scenario manager / state serialization | **再利用(温存)** | ゼロ |
| runtime orchestration | 自動 promote 除去(§8.3)/ **multi-scenario 化(§8.4)** / 任意 Run からの warm-restart wrapper `LiveSessionSeed`(§8.5、**要 spike**) | 小〜中 |
| workbench | **note pane を抜く** / controller の **束縛 scope**(§5.2) / custom button の transition policy 接続(§5.5) | 小 |
| engine ports(Catalog/Simulation/Verification)+ Contract 型 | 既存 engine を port 背後に置く(§11)。まず型境界、次に port、プロセス分離は後 | 中 |
| brief(compose layer + BriefSpec + binding freeze) | **新規** | 中 |
| document editor(typed block + CellPlacement + publish) | **新規**(note を吸収、note ベースでない) | 中〜大 |
| reader(inflow/peek/launch tier, mobile sheet) | brief の投影として新規 | 中 |
| command 層(Domain/Session 分離、log + snapshot) | 既存操作を整理して被せる | 中 |
| migration(現行 `CaseDocument` → Project/Run/Experiment/Document) | ID/ACL/保存先/既存 case 変換/import-export 互換/rollback を含む(§17-4) | 中〜大 |

- **真に新規なのは brief compose layer と document editor**(+ multi-scenario runtime orchestration と port 整備)。「brief だけが新規」は言い過ぎだった(訂正)。workbench の graph board / inspector / scenario manager は§4〜5 の結論と既に一致しており温存。

---

## 17. 却下した代替案と理由(再発防止)

| 却下案 | 理由 |
|---|---|
| **完全自由 tile を app 全体の IA にする** | non-spatial(controller/metric)に空間の自由を与えると祖先の scroll 地獄が再発。mobile で崩れ、読み順が無く、AI 生成・accessibility・versioning に不利。free tile は **cell の fullscreen 内側**にだけ残す |
| **role area を canonical のまま維持** | graph の空間配置は content(RV/LV に意味)。graph 側まで固定 area にしたのが誤り。graph は解放すべき |
| **再帰的 composition tree(split/tabs/accordion を任意保存)を brief に** | Dockview をデータで作り直す over-engineering。→ named recipe + role tag。graph board 自身の recursive split は別レイヤーで可(§4.6) |
| **fullscreen = 全部見せ・自動配置の正典** | attention 上も perf 上も無理。author は fullscreen でも絞る。fullscreen も author 配置の「選択」(§4.1) |
| **引き算(全部から hide して brief を作る)** | 全要素に priority メタデータ → category と喧嘩、workbench を星で汚す、臨床医に無意味。→ 足し算(pin) |
| **優先度を全 param(20個)に付与して sort** | category 破壊・気持ち悪い。→ 優先度は拾った少数(3〜4)にだけ |
| **board を scenario で grouping / 意味論サブグループの入れ子** | 1 graph に複数 scenario を重ねる場合が扱えない。組織単位は scenario でなく graph |
| **dual-scenario 制御のために free tile** | 束縛問題をレイアウト問題と誤認。scenario-scoped controller(scope 束縛)で解ける |
| **controller が scenario の値を所有** | N scenario 分を単一 controller が持てない・desync。inspector over scenario manager が正しい |
| **runtime を単数 scenario 前提のまま** | 中核ユースケース(Ees baseline vs HFrEF)が動かない。multi-scenario live transition が必須(§8.4) |
| **過渡表示を数十倍速に加速** | HR 変化に誤認され波形の形を歪める。表示 1×・計算だけ背景高速 |
| **verified steady へ自動 promote(現行実装)** | 過渡が切れ波形 jump・位相変化。明示ボタン + beat 境界 phase 合わせ(§8.3) |
| **V&V を実行の副作用にする / Reader で V&V を走らせる** | 重い。V&V は snapshot への純粋な問い合わせにし author 時のみ。Reader は certified snapshot で検証ゼロ(§8.6) |
| **RunArtifact に波形・詳細 metric を保存** | 冗長。settledSnapshot から再生成できる。snapshot だけ残す(§2.5) |
| **純 event-sourcing(log replay で再現)/ engine に event-sourcing** | engine/schema 更新で replay 不能。再現性は snapshot、diff/undo は log。engine は stateless 変換器(§10.3, §11.4) |
| **slider 操作を versioned stack に積む** | 1ドラッグで数百 event・窒息。SessionCommand は捨てる |
| **presentation ↔ engine を直接疎結合** | 必ず内部型が漏れる。間に Application/Command 層を噛ませた三者構造にする(§11.1) |
| **note pane をベースに document editor** | note はテキスト欄で document の器と別物。note は text block に吸収し editor 本体は新規 |
| **cell を1語で通す(identity 未分割)** | Experiment / CellPlacement / Session を混同すると再利用・更新・publish が破綻(§2.1) |
| **catalog をグローバルにする** | model で coronary 等の機能差がある。catalog は model+version が所有し Experiment が pin(§2.3) |
| **Notion 型 editor / wizard / free canvas / batch / fitting を v1 で作る** | 導線から外れる深掘り。v1 は導線を最終形で、導線外は浅く |
| **全 experiment に predict→manipulate→reveal を強制** | 専門書・reference article で不自然。quiz は任意 block |
| **headless-only service に割り切る** | beginner 5割の pedagogy を汎用チャットに丸投げできない。core は headless、product は headless-only にしない |
| **Study / ScenarioRevision を v1 から first-class** | 概念過多で麻痺。v1 は Run + Experiment + Document、境界だけ守る |

---

## 18. 未確定・要確認事項(open questions)

1. **§8.4 / §8.5(最優先 spike)**:任意の pinned Run(複数)から N 本の live session を同時温間再開し、自動 promote を外して 1× で重ね描けるか。受け入れ条件:(1) pinned state から波形を崩さず復元 (2) slider で core を reset せず連続積分 (3) HR/phase が不自然に jump しない (4) 1× で 5〜6 beat 安定描画 (5) slider 再操作で古い steady job 破棄 (6) 前景 N 本 + 背景 verifier N 本同時で frame 落ちなし (7) offscreen で積分停止/再開 (8) Reset で完全復帰。**これが通らなければ Reader 体験の前提が崩れる。**
2. brief の cutoff 数(inflow 上位1 / peek 上位2〜4)を固定にするか author が nudge 可能にするか(§6.4)。
3. `Study` / `ScenarioRevision` を first-class 化する具体的トリガー(fitting / patient-data 導入時)。
4. **migration**:現行 `CaseDocument`(instances / solver / views / graphBoardLayout / notes / reading / exposedControllers)→ Project/Run/Experiment/Document の分解。ID/ACL/保存先/既存 case 変換/import-export 互換/rollback を含む(§16)。
5. **外部 interactive 配信**:MCP だけでは任意ホスト上に interactive widget を描けない。外部 slide/article には **Embed SDK**(公開 Experiment を iframe/web component)と **EvidenceBundle**(SVG/PNG/CSV + caption/methods/limitations/provenance)が要る。v1 skip でよいが設計に残す。
6. **患者 fitting の安全境界**:observed / simulated / fitted / literature-assumption を常に区別。identifiability / UQ / held-out validation 無しの単一「最適患者パラメータ」を出さない。新モデル生成は sandbox の unverified draft として隔離。
7. metrics の連続性(§8.5):beat accumulator まで serialize するか、restart 後最初の一心拍を「集計中」で済ませるか。
8. MCP write の gate 設計(どの DomainCommand を外部から許すか、publish 系の review フロー、§10.5)。
9. custom button の「介入 onset 生理学的正確さ」(§5.6)を v1 のどこまで入れるか。
10. Library / 発見導線(既存の公開 Experiment を探して埋め込む)を IA のどこに置くか。

### 実装ハンドオフ前に閉じるべき規範別紙(推奨)
- **V1 Normative Contracts**:Project / Document / CellPlacement / Experiment(Draft/Revision) / Scenario / RunArtifact / Session の schema・参照・invariant・publish transaction(§2.5 を起点に確定)。
- **State & Sequence**:reader 操作、offscreen suspend、scratch 保存、Compose、**multi-scenario transition**、publish の状態遷移図。
- **Scope & Acceptance**:v0.1 / v1 / later、ADR-STUDIO-001 の置換範囲、必須 spike(§18-1)、migration、mobile・accessibility・performance の合格条件。

---

## 19. 一文サマリー

> **UI では cell と document の2オブジェクトだけを置き(ドメインでは Experiment / CellPlacement / Session に割る)、read→interact→author を「別 surface への移動」ではなく Extent × Capability × RuntimeState × Context の4軸で表す。workbench(fullscreen)は catalog(model 所有)からの足し算選択で、spatial(graph=author 配置=content)と non-spatial(controller/metric=inspector、controller は scenario manager への inspector、既定 active・任意で scenario subset bind)に割る。brief は catalog⊃working set⊃brief の足し算(pin+rank、参照でなくコピー)で作り、優先度は拾った少数にだけ持ち、workbench に痕跡を残さない compose layer で、materialize 時に binding を explicit に freeze する。runtime は前景 live 1×/背景 strict verifier を N 本同時に回す multi-scenario 過渡表示で、pin できるのは steady∧verification-passed のみ、Reader は certified snapshot から検証ゼロで波形を再生成する(RunArtifact は snapshot を残し波形は捨てる)。V&V は実行から疎結合な純粋問い合わせにし author 時のみ走らせる。presentation は engine を直接知らず、間の Application/Command 層と CatalogPort/SimulationPort/VerificationPort だけを介し、port を越える型は serializable な Contract に限り engine は stateless な値変換器に徹する(event-sourcing は編集層だけ、engine には持ち込まない)。versioning は command log から diff/undo/AI を、materialized snapshot から再現性/pin を別々に得る。UI・AI・MCP・CLI は全部この単一 command 層のクライアント。最初の spike は「任意 pinned Run 群からの N 本同時 warm-restart・自動 promote なし・1× 重ね描き」。**
