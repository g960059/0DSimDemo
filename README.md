**日本語** | [English](./README.en.md)

# CircleHeart

> モデリングと教育のための、ブラウザ上で動作する **0D 閉ループ循環血行動態シミュレーター**。能動応力（active-stress）型の心腔、動的な弁、体循環・肺循環の windkessel ツリー、心膜・中隔結合、3 領域の冠循環床を備え、陽的 Runge–Kutta（RK）ソルバーと質量保存型の総血液量（total-blood-volume, TBV）台帳によって統合的に積分します。

---

## ⚠️ 免責事項 — 研究・教育目的のみ

**CircleHeart は医療機器ではありません。** モデリング・教育・探索のために構築されており、診断・治療・患者個別の臨床的判断に **使用してはなりません**。

- 本ツールは **0D 集中定数（lumped-parameter）モデル** です。空間的な血流、局所の壁応力、3D 血行動態は解像しません。
- **パラメータは校正（calibration）の目標値であり、固定された生理学的定数ではありません。** 出力は近似値であり、**臨床データに対して検証されていません**。
- いくつかのサブシステムは **モデル化されていません**（例: 腎・肝・門脈床、詳細な圧受容器反射、体液交換）。
- 特定の患者を予測するためではなく、**直観を養い仮説を探索する** ために使用してください。

これらの限界はアプリ内で明示されており（初回起動時のモーダル。`components/ModelLimitations.tsx` を参照）、すべての公式ケースに付随しています。

---

## 目次

- [概要](#概要)
- [モデル](#モデル)
- [研究者向け](#研究者向け)
- [機能](#機能)
- [技術スタック](#技術スタック)
- [はじめに](#はじめに)
- [スクリプト](#スクリプト)
- [テスト](#テスト)
- [プロジェクト構成](#プロジェクト構成)
- [校正の方針と生理学](#校正の方針と生理学)
- [コントリビューション](#コントリビューション)
- [ライセンス](#ライセンス)

---

## 概要

CircleHeart は、閉ループ循環系をリアルタイムにシミュレートするツールです。0D 集中定数ネットワークとして実装され、陽的 Runge–Kutta ソルバーで積分されます。すべてブラウザ上で動作し、**シミュレーションエンジン**（`engine/`）と **UI**（`components/`）が明確に分離されています。

**生理学ノブ（physiology knobs）**（収縮性、後負荷、心拍数、弁病変、輸液・出血、換気・PEEP など）で循環を摂動させ、複数の同期したビューを通じて応答を観察します。具体的には **波形（waveforms）**、**圧容積ループ（pressure–volume loops）**、**Guyton/Starling 動作マップ**、そして **冠循環（coronary）ペイン**（圧、流量、FFR）です。モデルが中核であり、シミュレーターの上に **オーサリング可能なインタラクティブ・レッスンシステム** と一連のキュレーションされた **公式ケース（official cases）** が乗っています。これにより、同一エンジンがモデリング／探索と体系的な教育の両方に対応します。

病的・異常な領域（regime）が主要なユースケースです。モデルは **形状優先（shape-first）** でチューニングされており、波形のモルフォロジーと摂動下での変化の *方向* を、絶対値の厳密な一致よりも優先します（[校正の方針](#校正の方針と生理学)を参照）。

---

## モデル

0D 閉ループ集中定数循環モデル:

- **能動応力（active-stress）型の心腔**（LV, RV, LA, RA）— 能動応力ジェネレーターを備えた壁力学（wall-mechanics）型の心腔。代替モードとして **時変エラスタンス（time-varying elastance）** モードも備えます。
- **動的な弁**（MV / AoV / TV / PV）— 有限の開閉ダイナミクスと病変サポート（狭窄・逆流: AS / MR / AR / TR）を持ちます。
- **体循環・肺循環ツリー** — windkessel 型の動脈・静脈コンパートメント（コンプライアンス、抵抗、慣性）。
- **心膜圧 + 中隔（心室間相互作用）結合**（`engine/mechanics/pericardium.ts`, `engine/mechanics/septum.ts`）。
- **3 領域の冠循環床**（LAD / LCx / RCA）— 心筋内圧迫、狭窄、FFR を備えます。
- **質量保存型** の閉ループ。輸液負荷・出血を駆動する **総血液量（TBV）台帳** と、保存的な静脈圧コレクターを備えます。

モデルの状態は **陽的固定ステップ Runge–Kutta 積分器** で進められます。具体的には **Heun 法**（RK2 予測子–修正子: Euler 予測子、状態のサニタイズ、続いて台形修正子。`engine/ModelCore.ts`）です。積分は所与の `dt`／プラットフォームに対して決定論的です。デフォルトのシナリオステップは `dt = 1e-3 s` です。モデル定義とノブ／パラメータ契約は **`engine/ModelCore.ts`** と **`engine/protocol.ts`** にあります。後者は、状態を進める前に積分器にとって安全なパラメータのクランプ（clamp）も強制します。

---

## 研究者向け

- **エンジン ↔ UI の分離。** すべての物理は `engine/` にあり、React から独立しています。UI はその消費者です。モデルはヘッドレスで駆動できます。
- **ヘッドレス・シナリオハーネス。** `engine/harness.ts` は `runScenario(params, options) → ScenarioResult` を公開します。これは `ModelCore` を構築し、目標 TBV に向けて静脈圧をシードし、（固定長ラン、または収束検出による）定常状態まで整定（settle）させ、測定ウィンドウを実行して、`core`、`metrics`、`health`、記録された `samples`、ウィンドウ開始／終了時の TBV、そして質量保存の指標 `driftPctPer60s` を返します。オプションには `targetTBV`、`settleSeconds` / `settleMode`（`"fixed"` | `"converge"`）、`measureSeconds`、`dt`、`sampleHz` があります（`BASELINE_OPTIONS` のデフォルト: TBV 5600、整定 60 s、測定 30 s、`dt` 1e-3、120 Hz）。ヘルパーとして `recordValveExtremes()`（ウィンドウ内で弁が実際に開き *かつ* 閉じることを検証する）と `summarize()`（丸めた変化検出スナップショット）も公開されています。`ModelCore` 自体も `step()`、`runFor()`、`settleToSteady()`、`metrics()`、`health()` を公開しており、カスタムドライバーに利用できます。
- **可観測性（observability）。** 圧、流量、心室・心房の PV ループ、Guyton/Starling の静脈還流／心機能（venous-return / cardiac-function）動作マップ、冠循環各領域の流量／FFR は、いずれもファーストクラスの出力です。
- **質量保存。** TBV 台帳と保存的な静脈圧補正によってループは質量保存的になります。`driftPctPer60s` は測定ウィンドウにおける残留積分ドリフトを報告するため、保存性を直接監査できます。
- **再現可能なゲート（gates）。** Vitest スイートには、ベースラインのスナップショットフリーズと **波形モルフォロジーゲート**（PV ループの形状、僧帽弁流入の E/A、心房の 8 の字（figure-8）ループなど）が含まれており、挙動の変化をリグレッションとして検出します。
- **文献に裏付けられたパラメータ妥当性ナビゲーター。** [`docs/research/README.md`](docs/research/README.md) はモデルのエビデンス基盤です。すべてのパラメータ群 — 心腔形状／EDPVR（Klotz）、能動応力の上限、動脈・静脈ノード、エッジの R/L → SVR/PVR、弁の EROA、心膜・中隔結合、Guyton/Starling ペイン、冠循環、波形モルフォロジー、心房の AV 平面（AV-plane）リザーバ、ケースごとの妥当性レビュー — を **正典的な文献ソース** にトレースします（Klabunde, Guyton & Hall, Suga/Sagawa, Sunagawa, Burkhoff, Westerhof/Stergiopulos, Garcia/Otto, CircAdapt, Klotz, Carlsson/Arheden など）。その基本ルールは厳格です: **実在する文献のみ**（捏造した引用／DOI／ページは禁止）、**コードで検証済みまたは二者間でクロスチェック済みの数値**、明示的な単位、そして文献上の目標値・モデル値・判定（verdict）を分けて記す **誠実なオープンクエスチョン台帳** です。

---

## 機能

### シミュレーション / Workbench
- ノブを回すと更新される、ライブのリアルタイム **波形**（例: LV／大動脈／心房の圧、流量）。
- 心室の **圧容積ループ（PV ループ）**、および心房の **8 の字（figure-8）** ループ。
- **Guyton / Starling 動作マップ** — 前負荷と動作点を考えるための静脈還流／心機能ペイン。
- **冠循環（coronary）ペイン** — LAD/LCx/RCA 各領域の心筋内圧、狭窄、FFR を表示。
- **生理学ノブ**: 収縮性、後負荷（体血管抵抗／動脈スティフネス）、心拍数、静脈トーン、弁病変（AS / MR / AR / TR）、輸液負荷と出血、呼吸／PEEP。
- カスタムビューを組み立てるための、構成可能でドラッグ可能なパネルグリッド。

### 生理学モデル
- **能動応力（active-stress）型の心腔**（LV, RV, LA, RA）。代替の時変エラスタンスモードも備えます。
- 有限の開閉ダイナミクスと病変サポート（狭窄・逆流）を持つ **弁**。
- **体循環・肺循環** の動脈・静脈ツリー（windkessel 型のコンプライアンス、抵抗、慣性）。
- **心膜圧 + 中隔（心室間相互作用）結合。**
- **冠循環**（心筋内圧迫と狭窄／FFR を備えた 3 領域床）。
- **質量保存型** の閉ループ。輸液・出血のための総血液量台帳を備えます。

### レッスン（教育レイヤー）
- **Learn モード**: リッチテキスト、数式（KaTeX）、埋め込みシミュレーションペインを備えたオーサリング済みレッスンをステップごとに進めます。
- **オーサリング**: レッスンを作成し、学習者がライブで操作できる少数のノブを公開（expose）し、保存します。
- **共有**: レッスンはローカルに永続化され（オフラインで動作）、必要に応じて **Firebase** クラウド同期で共有できます。

### 公式ケース
- 通常のベースライン上で、生理学ノブ／名前付き介入により作成された、キュレーション済みのリポジトリ内シナリオ。例:
  - 正常生理
  - 心原性ショック: LV 不全 ± ドブタミン
  - 弁膜症病変: 大動脈弁狭窄症および僧帽弁逆流症
  - 循環血液量減少（hypovolemia）
- 各ケースは独自のモデル限界注記を持ち、波形形状のリグレッションゲートの対象にもなります。

---

## 技術スタック

- **React 19** + **TypeScript**、**Vite 6** でバンドル
- **Tailwind CSS**（`@tailwindcss/vite` 経由）
- チャートと PV ループのための **D3** と **Recharts**
- リッチテキストのレッスンオーサリングのための **BlockNote**
- 数式のための **KaTeX** / `react-katex`
- 構成可能なパネルダッシュボードのための **react-grid-layout**
- クラウドレッスン共有のための **Firebase**（Google 認証 + Firestore）
- エンジンと UI のテストスイートのための **Vitest**

---

## はじめに

### 前提条件
- **Node.js**（最新の LTS リリースを推奨）

### インストールと実行
```bash
npm install
npm run dev
```

これで Vite 開発サーバーが起動します（デフォルト `http://localhost:3000`）。シミュレーター、Workbench、公式ケース、そして **ローカル** レッスンは、追加設定なしですべてオフラインで動作します。

### Firebase（任意 — クラウド機能のみ）
Google サインインと **クラウドレッスン共有** は Firebase に支えられています。これらは任意であり、それ以外はアカウントなしで動作します。Firebase プロジェクト設定はリポジトリ内にあります（`firebaseSetup.ts`, `firebase.json`, `firestore.rules`）。自分のプロジェクトでクラウド機能を有効にするには、それらを自分の Firebase プロジェクトに向け、Firestore ルールをデプロイしてください。

---

## スクリプト

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | HMR 付きで開発サーバーを起動 |
| `build` | `tsc && vite build` | 型チェックの後、本番ビルドを生成 |
| `preview` | `vite preview` | 本番ビルドをローカルで配信 |
| `test` | `vitest run` | テストスイート全体を一度実行 |
| `test:watch` | `vitest` | ウォッチモードでテストを実行 |

---

## テスト

```bash
npm run test
```

このスイート（Vitest）は **シミュレーションエンジン** と **UI** の両方をカバーします。主要な信号の形状（PV ループ、僧帽弁流入の E/A、心房ループなど）のリグレッションを防ぐ生理学 **波形モルフォロジーゲート** や、意図しない挙動変化を検出するベースラインスナップショットフリーズも含まれます。コントリビュート時はスイートをグリーンに保ってください。

---

## プロジェクト構成

```
engine/         0D model core (ModelCore.ts), explicit RK solver, knob/parameter
                contract (protocol.ts), headless scenario harness (harness.ts),
                mechanics (pericardium/septum), observables + engine tests
components/     React UI — Workbench, Charts (waveforms / PV loop / Guyton-Starling / coronary),
                Controls (physiology knobs), Home, lessons (LessonPlayer / LessonAuthoring),
                ModelLimitations, official cases UI
components/workbench/   panel grid + editor, headers, side panels (the dashboard shell)
docs/research/  physiology parameter-validity navigator (literature-grounded validity docs)
officialCases.ts        curated teaching scenarios
contexts/, lessonCloud.ts, firestore.rules, firebase.json   Firebase auth + cloud lesson sharing
__tests__/, *.test.ts   Vitest suites
```

---

## 校正の方針と生理学

CircleHeart は循環を、集中定数コンパートメントの閉ループとしてモデル化します。能動応力型の心腔、動的な弁、体循環・肺循環ツリーに、心膜・中隔結合と冠循環床を重ねた構成です。設計思想は **形状優先（shape-first）** です。波形モルフォロジーと摂動下での変化の *方向* を絶対値の一致よりも優先します。なぜなら、異常・病的シナリオこそが本ツールの主眼だからです。パラメータは固定定数ではなく **校正の目標値** として扱ってください。モデルは *定性的* な血行動態応答を再現するために構築されており、絶対値は近似です。

**生理学妥当性ナビゲーター** — [`docs/research/README.md`](docs/research/README.md) — がエビデンス基盤です。各パラメータ群（心腔形状／EDPVR、弁、心膜／中隔、Guyton/Starling、冠循環、波形モルフォロジー、心房 AV 平面リザーバなど）を正典的な文献ソースにトレースし、モデル値、計算、誠実な判定（verdict）／オープンクエスチョンリストを記録しています。

---

## コントリビューション

- **ドキュメントの基本ルール**（`docs/research/README.md` を参照）: **実在する文献のみ** を引用すること — 引用・DOI・ページ番号を決して捏造しないこと。数値は **コードで検証済みまたは二者間でクロスチェック済み** であること。ギャップとオープンクエスチョンを誠実に記録すること。常に単位を明示すること。
- **テストはグリーンを維持すること。** 変更を提出する前に `npm run test` を実行してください。生理学モルフォロジーゲートはスイートの一部です。

---

## ライセンス

現在このリポジトリには `LICENSE` ファイルが存在しません — ライセンスは **未定（to be determined）** です。コードを再利用する前に、リポジトリを確認する（または issue を立てる）ようにしてください。
