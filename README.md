**日本語** | [English](./README.en.md)

# CircleHeart

**CircleHeart** は、研究・教育を目的とした **0D 閉ループ循環動態シミュレーション・ワークベンチ**です。
単に数値パラメータを動かすツールではなく、**症例・介入・波形・PV ループ・指標・解説ノート**を同じ画面で読み比べるための physiology workbench として設計されています。

能動応力（active-stress）型の心腔、動的に開閉する弁、体循環・肺循環の windkessel ツリー、心膜・中隔による左右心相互作用、3 領域の冠循環床を備え、固定ステップの陽的 Runge–Kutta 法（2 次の Heun 法）と質量保存型の総血液量（TBV）台帳によって統合的に積分します。

主な対象読者は、循環動態モデル・0D シミュレーション・医用工学・麻酔/循環器領域の研究者です。後期研修医・初期研修医・臨床工学技士など、循環動態を学びたい臨床ユーザーも、公式レッスンと公式ケースから入って使い始められます。

## ドキュメントの現在地

現行コードは、legacy `ActiveStressChamberModel` を中核にした実働プロトタイプです。一方で、次の心筋収縮サブシステムは Revision 3 として全面置換方針を整理中です。心筋刷新の正典候補は [`docs/myocardium/`](docs/myocardium/) にあります。

旧 ADR、旧ロードマップ、旧研究メモは、古い前提を正典のように読ませないためローカルの `docs/` から削除しました。必要な場合は git 履歴から参照してください。

---

## 重要: 研究・教育目的のみ

**CircleHeart は医療機器ではありません。**
診断・治療方針の決定・患者個別の予測・薬剤投与量の決定には使用しないでください。

本リポジトリが扱うのは 0D 集中定数（lumped-parameter）モデルです。心臓・血管・弁・冠循環を、空間的な広がりを持たないノードとエッジのネットワークとして表現します。そのため、以下は表現できません。

- 局所壁運動異常そのもの
- 3D 血流、渦、ジェット、局所 shear stress
- 個々の患者に固有の形態・組織特性
- 詳細な自律神経反射、腎・肝・内分泌系、体液移動
- 実臨床データに対する検証済みの患者予測

このプロジェクトが重視するのは、絶対値の完全一致ではなく、**波形の形、PV ループの変化、介入に対する応答の方向性、そしてモデルが破綻するときの見え方**です。数値は「校正・検証すべき対象」であって、固定された生理定数ではありません。

これらの限界はアプリ内でも明示しており（初回起動時のモーダル。[`components/ModelLimitations.tsx`](components/ModelLimitations.tsx) を参照）、すべての公式ケースに付随しています。

---

## このプロジェクトでできること

CircleHeart は、現在おおまかに次の 5 つの層で構成されています。

| 層 | 役割 |
|---|---|
| **Workbench** | 複数の循環状態を並べ、波形・PV ループ・指標・ノート・コントローラーを同時に見る作業画面 |
| **Official Cases** | 正常、AMI、HFrEF、HFpEF、AS、低容量性ショックなどの公式症例 |
| **Lessons** | 公式ケースを題材に、波形や PV ループの読み方を段階的に学ぶ対話的レッスン |
| **Simulation engine** | 0D 閉ループ循環モデル本体。React から分離され、`PreviewController` / harness から駆動される |
| **Docs / tests** | Revision 3 心筋刷新仕様、source registry、baseline freeze、steady-state 検証の記録 |

---

## 想定している使い方

### 1. 研究者向け

研究者には、次のような用途を想定しています。

- active-stress 型心腔モデルと時変エラスタンス型モデルの比較
- 弁の動的開閉、弁狭窄・逆流、オリフィス損失の挙動確認
- 体循環・肺循環の抵抗、コンプライアンス、静脈容量、TBV の摂動
- 心膜圧・中隔連成による左右心相互作用の検討
- LAD / LCx / RCA の 3 領域冠循環モデルと FFR 風指標の確認
- 公式ケースの出力が生理学的に妥当かどうかの検証
- calibration / validation / UQ へ進む前の baseline freeze と regression test

エンジンは UI から切り離されているため、[`engine/harness.ts`](engine/harness.ts) からヘッドレスにシナリオを走らせ、測定値・波形サンプル・health・TBV drift を取得できます（[ヘッドレス実行](#ヘッドレス実行研究者向け)を参照）。

### 2. 臨床ユーザー向け

臨床ユーザーは、まず公式レッスンと公式ケースから入るのがおすすめです。

- 正常心の LVP / AoP / LAP と PV ループを読む
- 急性前壁 MI で PV ループが低く狭くなる理由を見る
- HFrEF と HFpEF の違いを、波形・PV ループ・指標で比べる
- AS で LV–Ao 圧較差が生じる理由を見る
- 低容量性ショックで preload が減り、SV と CO が落ちる様子を見る

臨床判断を支援するツールではなく、**循環動態を「読み、触り、比べる」ための教育・研究用モデル**として使ってください。

---

## アプリの画面構成

| Route | 画面 | 内容 |
|---|---|---|
| `/` | Home | 公式レッスン、公式ケース、Workbench への入口 |
| `/cases` | Cases | 公式ケース、自分のケース、公開ケースの一覧 |
| `/lesson/:id` | Lesson | 公式ケースを題材にした対話的レッスン |
| `/workbench` | Workbench | 空のシミュレーション作業画面 |
| `/workbench/:caseId` | Case Workbench | 公式ケースまたは保存済みケースを Workbench で開く |

現在の中核は Workbench です。ここで複数の simulation instance を並べ、共通の波形ペイン・PV ループ・指標・コントロール・ノートで比較します。

---

## 公式ケース

| Case id | 表示名 | 主な学習ポイント |
|---|---|---|
| `normal-sinus` | Normal physiology | 正常成人の基準 operating point |
| `acute-anterior-mi` | Acute Anterior MI | 収縮性低下による低拍出、LAP 上昇、PV ループ縮小 |
| `systolic-heart-failure` | Systolic Heart Failure (HFrEF) | 低収縮性、SV/CO 低下、充満圧上昇 |
| `diastolic-heart-failure` | Diastolic Heart Failure (HFpEF) | 硬い LV、拡張障害、EF 保持下の充満圧上昇 |
| `aortic-stenosis` | Aortic Stenosis | 大動脈弁狭窄による LV–Ao 圧較差と高圧 PV ループ |
| `hypovolemic-shock` | Hypovolemic Shock | 低 preload、低 SV/CO、低圧波形 |
| `lv-failure-dobutamine` | Cardiogenic shock: LV failure ± dobutamine | LV failure と β1 刺激による回復方向の比較 |
| `valve-lesions` | Valvular lesions | AS と MR の比較 |
| `hypovolemia` | Hypovolemia | 静的な循環血液量低下モデル |

各公式ケースは、[`officialCases.ts`](officialCases.ts) 内に `CaseDocument` として静的に定義されています。ケースには、インスタンス・臨床ノブ・介入・パネル構成、必要に応じてノートが含まれます。

---

## 公式レッスン

| Lesson id | 表示名 | 目的 |
|---|---|---|
| `normal-reference` | Normal Physiology Reference | 正常波形、PV ループ、指標、コントロールの読み方 |
| `acute-anterior-mi` | Acute Anterior MI | 収縮性低下が PV ループと CO に与える影響 |
| `systolic-heart-failure` | Systolic Heart Failure (HFrEF) | HFrEF の波形・PV ループ・指標 |
| `diastolic-heart-failure` | Diastolic Heart Failure (HFpEF) | HFpEF の充満圧上昇と PV ループ |
| `aortic-stenosis` | Aortic Stenosis | 弁狭窄の圧較差と LV 負荷 |
| `hypovolemic-shock` | Hypovolemic Shock | 循環血液量低下による preload 低下 |

レッスンは、公式ケースのノートを読み進めながら、同じ症例を Workbench 上で確認する構成です。さらに、ステップごとに**限定公開されたノブ（exposed knobs）を学習者が実際に動かせる**ようになっており（[`components/LessonPlayer.tsx`](components/LessonPlayer.tsx)）、波形と PV ループがどう変化するかをその場で確かめられます。ステップを移動すると、いじったノブは初期値へ自動的に戻ります。

---

## Workbench の読み方

Workbench は、研究者にとってはモデル探索画面、臨床ユーザーにとっては波形読解画面です。

主なペインは次の通りです。

| ペイン | 内容 |
|---|---|
| **Scenarios** | 複数の simulation instance の表示、比較、切り替え |
| **Controls** | clinical knobs と一部の raw parameters の操作 |
| **Waveforms** | 圧、流量、弁状態、冠循環、心膜/中隔関連信号などの時系列 |
| **PV Loop** | LV / RV / LA / RA の圧容積関係 |
| **Metrics** | ABP、CVP、PAP、PCWP、SV、CO、EF、冠循環指標など |
| **Notes** | 症例解説、モデル限界、教育用メモ |

研究者は raw parameter を追えますが、通常の症例・教育コンテンツでは raw parameter より **clinical knobs** を優先します。ケースの保存・共有・将来のバージョン移行を安定させるためです。

---

## シミュレーションモデルの概要

現在のエンジンは、0D 閉ループ循環をノードとエッジで表します。状態量の単位は、圧が mmHg、容積が mL、流量が mL/s、時間が s、エラスタンスが mmHg/mL です。

### 心腔

- LV / RV / LA / RA を心腔ノードとして持ちます。
- 既定は **single-fibre / active-stress 型**です。
- 代替モードとして **time-varying elastance 型**も残しています。
- active-stress 型では、収縮・弛緩・受動圧・Tmax scale などが raw parameter として存在します。

### 弁

- MV / AoV / TV / PV を動的エッジとして扱います。
- 弁開度 `xi` は有限の開閉時定数を持ちます。
- 弁狭窄、逆流、抵抗、慣性、二次損失を扱います。
- テストでは、`xi` が 0–1 に clamp されることを確認するだけでなく、各弁が実際に開閉していることまで検証します。

### 体循環・肺循環

- 体循環: Ao, SA, Art, Cap, SV, VC
- 肺循環: PA, PArt, PCap, PVen, PVein
- 動脈・静脈コンパートメントには、非線形容量、collapse/open/stiff 領域、外圧を含むものがあります。
- 総血液量（TBV）を台帳として管理し、輸液・出血のモデルと整合させます。

### 心膜・中隔

- 心膜圧と心室間相互作用を扱います。
- 中隔変位は LV/RV の有効容積と圧生成に影響します。
- 現時点では TriSeg そのものではなく、0D workbench 向けの軽量な心室間連成です。

### 冠循環

- LAD / LCx / RCA の 3 領域モデルを持ちます。
- 心筋内圧、冠動脈狭窄、冠血流、FFR 風指標を扱います。
- 冠循環は教育・探索用の 0D 表現であり、詳細な冠動脈樹や局所虚血を表すものではありません。

### 数値積分

- Preview engine は固定ステップの陽的 Runge–Kutta 法（2 次の Heun 法）を使います（[`engine/ModelCore.ts`](engine/ModelCore.ts)）。
- 既定の `dt` は 0.001 秒です。
- Workbench では `PreviewController` が simulation core、sample buffer、health、steady transition を管理します。
- ブラウザでは Web Worker を優先し、利用できない環境では同期実行へ fallback します。

---

## ヘッドレス実行（研究者向け）

エンジンは UI から独立しているため、[`engine/harness.ts`](engine/harness.ts) の `runScenario` でシナリオをヘッドレスに走らせ、測定値・health・質量保存ドリフトを取得できます。

```ts
import { runScenario } from "@/engine/harness";

// raw params の部分指定でシナリオを定義し、真の limit cycle まで収束させて測定する
const result = runScenario(
  { /* CoreRuntimeParams の部分指定 */ },
  { settleMode: "converge", measureSeconds: 30 },
);

// grounded な測定では、値を信頼する前に settled を確認すること
if (result.settleStatus?.settled) {
  console.log(result.metrics);        // SV, CO, EF, 圧指標 など
  console.log(result.health);         // simulation health status
  console.log(result.driftPctPer60s); // TBV 質量保存ドリフト (%/60s)
}
```

`settleMode: "fixed"` は baseline freeze（byte-stable な change detector）用の経路で、固定秒数だけ回します。一方 `settleMode: "converge"` は steady-state detector で真の周期定常へ収束させ、`settleStatus.settled` を返します。文献値と突き合わせるような grounded な測定では、必ず `converge` で収束を確認してから値を読んでください。

clinical knobs から走らせたい場合は、[`engine/knobs.ts`](engine/knobs.ts) のマッピングで raw params に変換してから `runScenario` に渡します。

---

## Clinical knobs と raw parameters

このプロジェクトでは、ユーザーに直接見せる操作語彙として **clinical knobs** を定義しています。

例:

- HR
- contractility / contractilityRV
- relaxation
- diastolicStiffness
- afterload
- arterialStiffness
- pulmonaryResistance
- venousTone
- PEEP
- aorticStenosis / mitralRegurgitation などの弁病変 severity

clinical knob は raw parameter へ写像されます。この写像は `knobMappingVersion`（現在 `knobmap-0.3-activestress`）でバージョン管理されており、保存済みケースは作成時の mapping version に基づいて解決されます。未知の mapping version では silent fallback せず、明示的に失敗します。

この方針により、ケースの再現性を保ちます。raw parameter をそのまま保存・共有するのではなく、原則として「臨床的な意味を持つ操作」と「基準 baseline」を保存します。

---

## CaseDocument: 保存・共有の単位

Workbench の状態は、[`caseDoc.ts`](caseDoc.ts) で定義される `CaseDocument` として保存されます。

`CaseDocument` には次の情報が含まれます。

- schemaVersion / engineVersion / knobMappingVersion
- solver config
- meta 情報
- case spec
- simulation instances
- panel layout / workspace layout
- notes
- reading / lesson layer
- exposed controllers

重要なのは、**表示可能なケースには modelLimitations が必須**であることです。ケースは単なるパラメータセットではなく、「何を見せるか」「どの限界を持つか」を含む教育・研究用 document として扱います。

---

## 検証と regression test

このリポジトリでは、モデルの正しさを「一度に証明する」のではなく、少なくとも次の 3 段階に分けて扱います。

1. **Numerical safety**: NaN/Inf が出ない、状態が有限、積分が破綻しない
2. **Invariants**: TBV drift、左右流量バランス、弁開閉、clamp hit、health status
3. **Physiology morphology**: PV ループ、E/A、LA/RA figure-eight、PVF S/D/Ar、正常弁での逆流の少なさ

`baseline.test.ts` の baseline freeze は、現行挙動の change detector です。これは「生理学的に完全に妥当」という主張ではなく、意図しない挙動変化を検出するための固定点です。

研究上の妥当性は、Revision 3 の心筋刷新文書、source registry、今後の calibration / validation / UQ によって更新していきます。

---

## 文献・妥当性ドキュメント

[`docs/README.md`](docs/README.md) が現在の文書入口です。心筋収縮サブシステム刷新については [`docs/myocardium/README.md`](docs/myocardium/README.md) から読んでください。

Revision 3 では、次のルールを採用しています。

- 実在する文献のみを引用する
- DOI、ページ番号、引用を捏造しない
- 数値はコードで検算するか、二者間でクロスチェックする
- 文献目標値、モデル値、判定、open question を分けて書く
- 単位を明示する
- 絶対値よりも、波形形状と変化方向を優先する

心筋刷新のmachine-readable source registryは [`data/myocardium/sources.json`](data/myocardium/sources.json) です。Phase A の方程式、parameter fixture、target pack、acceptance threshold には、`verificationStatus: "verified"` のsourceだけを使います。

---

## セットアップ

### 前提条件

- Node.js LTS
- npm

### インストール

```bash
npm install
```

### 開発サーバー

```bash
npm run dev
```

Vite 開発サーバーは、既定で次の URL に立ち上がります。

```text
http://localhost:3000
```

### ビルド

```bash
npm run build
```

### 本番ビルドのプレビュー

```bash
npm run preview
```

---

## スクリプト

| Script | 内容 |
|---|---|
| `npm run dev` | Vite 開発サーバーを起動 |
| `npm run build` | TypeScript check と production build |
| `npm run preview` | production build をローカルで確認 |
| `npm run test` | PR CI と同じ fast Vitest suite を実行（Firestore emulator と opt-in heavy verification tests は除外） |
| `npm run test:all` | opt-in heavy verification tests を含む full Vitest suite を実行 |
| `npm run test:heavy` | opt-in heavy cases を有効にして Guyton/Starling と low-preload verification files を実行 |
| `npm run test:rules` | Firestore rules emulator test を実行 |
| `npm run test:watch` | watch mode で Vitest を実行 |
| `npm run verify:baseline` | baseline verification script を実行 |
| `npm run fit:left-filling` | 左心系 filling 関連の fitting tool |
| `npm run fit:right-pvf-headroom` | 右心系 / PVF headroom 関連の fitting tool |

---

## 技術スタック

- React 19 / react-router-dom 7
- TypeScript
- Vite 6
- Tailwind CSS 4
- D3 / Recharts
- dockview
- BlockNote
- KaTeX / react-katex
- lucide-react
- Firebase / Firestore
- Vitest

現在の Workbench layout は dockview 系の構成を使っています。古い README や設計メモに出てくる `react-grid-layout` 前提の記述は、現在の実装とは一致しません。

---

## プロジェクト構成

```text
engine/
  ModelCore.ts              0D 循環モデル本体
  protocol.ts               raw parameter schema, clamps, metrics, health
  knobs.ts                  clinical knob -> raw parameter mapping
  harness.ts                headless scenario runner
  previewController.ts      Workbench 用 preview driver
  chambers.ts               active-stress / elastance chamber model
  mechanics/                pericardium, septum
  fitting/                  calibration / objective utilities
  verification/             verification report utilities

components/
  Home.tsx                  Home
  Cases.tsx                 case explorer
  LessonPlayer.tsx          対話的レッスン（exposed knobs）
  reading/                  lesson reading mode
  workbench/                Workbench panes, dockview, settings
  HealthIndicators.tsx      simulation health UX
  ModelLimitations.tsx      model limitation UI

caseDoc.ts                  CaseDocument schema and conversion
caseCloud.ts                Firestore case persistence
casePersist.ts              local import/export/persistence
lessonDoc.ts                official lesson definitions
officialCases.ts            official case definitions
constants.ts                app-level default params

docs/                       current documentation entry point
docs/myocardium/            Revision 3 myocardium replacement docs
data/myocardium/            machine-readable source registry
__tests__/                  app / case / reading tests
engine/__tests__/           engine regression and morphology tests
tools/                      verification / fitting scripts
```

---

## コントリビューション方針

このプロジェクトでは、見た目のリファクタよりも、**モデルの再現性・検証可能性・説明可能性**を優先します。

変更時は、少なくとも次を確認してください。

```bash
npm run test
```

モデルやパラメータを変える場合は、以下を明確にしてください。

- 何の生理学的問題を直すのか
- どの文献・実測・ベンチマークに基づくのか
- Guyton/Starling や low-preload 挙動に触れる変更では、`npm run test:heavy` または `npm run test:all` を実行したかどうか
- どの波形・PV ループ・metric が改善するのか
- どのケースが影響を受けるのか
- baseline freeze を更新する必要があるのか
- model limitations に追記すべきことはないか

ケースやレッスンを追加する場合は、必ず model limitations を書いてください。臨床的に見える UI ほど、どこまで信じてよいかを明示する必要があります。

---

## 現在の位置づけ

CircleHeart は、すでに単なる UI モックではなく、legacy active-stress 型心腔、動的弁、体循環・肺循環ネットワーク、心膜・中隔連成、冠循環、TBV 台帳、公式ケース、レッスン、Workbench、case persistence、health / morphology tests を備えた実働プロトタイプです。

一方で、まだ validated simulator ではありません。

心筋収縮サブシステムは Revision 3 で全面置換方針を整理中です。Revision 3 は現行runtimeを説明する文書ではなく、Phase 0 のowner decisions後に進める次期実装契約です。

今後の重要テーマは、機能追加そのものよりも、以下です。

- calibration
- validation
- uncertainty quantification
- steady-state / transition-state 契約の安定化
- preview engine と accurate engine の役割分離
- 症例ごとの妥当性レビュー
- 文献根拠とモデル限界の継続的な更新

この README は、現時点の実装を過大評価せず、研究・教育用 workbench としての現在地を率直に記述することを意図しています。

---

## ライセンスと引用

現時点では、リポジトリに `LICENSE` ファイルはありません。**ライセンス方針が定まるまで、コードの再利用条件は未確定**です。再利用を検討する場合は、利用前にメンテナへ確認してください。

研究の文脈で本プロジェクトに言及する場合は、参照したコミットのハッシュ（リビジョン）を併記してください。CircleHeart はまだ validated simulator ではなく、挙動はリビジョンによって変化し得るためです。
