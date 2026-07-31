**日本語** | [English](./README.en.md)

# CircleHeart

CircleHeart は、研究・教育向けの 0D 閉ループ循環動態シミュレーションと、
Experiment authoring / Reader 体験を開発する pre-release プロジェクトです。

現在はユーザー 0・本番データ 0 の直接切り替え期間です。旧 Case / Lesson /
Studio V1 のデータモデルを互換維持せず、新しい exact-model registry と
Experiment / Snapshot / Placement 構造へ置き換えています。削除した設計や
実装は Git 履歴から参照できます。

## 現在の正典

Studio のデータ構造と所有境界は
[`docs/studio/DESIGN-STUDIO-003-experiment-data-architecture.md`](docs/studio/DESIGN-STUDIO-003-experiment-data-architecture.md)
を唯一の正典とします。

中心となる構造は次のとおりです。

```text
RegisteredModel(modelId)

ExperimentWorkspace (mutable)
  └─ ExperimentContent
       ├─ ScenarioCapture[] = fixture + checkpoint
       └─ ExperimentSurface = graphs + readouts + controls + one note

ExperimentSnapshot (immutable)
ExperimentPlacement (pins one snapshot)

SimulationSession / preview cache (ephemeral)
```

主な判断:

- `modelId` は equations、runtime、solver、fixture schema、checkpoint
  codec、catalog、snapshot gate を固定する exact immutable identity
- package integrity は registry 登録時にのみ検査し、client runtime は
  registry を信頼する
- parameter変更 action はfixtureへ反映された時点で役目を終え、durable
  `ParameterSet` は作らない
- Preset、Draft、Snapshot の Scenario は `fixture + checkpoint` を一体で持つ
- Draft は未settledでも保存でき、Snapshot作成時だけsettlementとminimum
  numerical gateを要求する
- immutable版は数値revisionではなく`snapshotId`で識別する
- `parentSnapshotId`はlineageだけを表し、自動継承しない
- 記事内PlacementはSnapshotを直接pinする
- settlement、numerical health、input epoch、live samplesは永続化しない

## V3への移行順序

公式Scenario Preset、Experiment、記事、Lessonはまだ作成しません。

1. portable fixture/control/checkpoint境界を
   `MainWireIntegratedModelTransactionV3`へ接続する
2. V3のmodel packageをexact `modelId`でregistryへ登録する
3. その登録済みpackageを新規Experimentのdefault modelにする
4. WorkbenchのSave/SnapshotとReader Placementを接続する
5. その後に公式Preset、Experiment、記事、Lessonを制作する

それ以前のcase catalog、lesson document、numeric Experiment revision、
Working Set / Reader Brief、certification artifactは製品データの正典では
ありません。

## 数値モデルと研究資料

`engine/`、`tools/`、`data/myocardium/`、`docs/myocardium/`には、
V3統合に必要な数値実装、verification、研究artifactが含まれます。
これらはStudioのdurable contentとは別の境界です。研究artifactのintegrity
digestや算出結果をExperimentへコピーしません。

V3 packageのregistry登録が完了するまでは、製品surfaceはHomeと
pre-registration Workbenchだけです。

## 重要: 研究・教育目的のみ

CircleHeart は医療機器ではありません。診断、治療方針、患者個別予測、
薬剤投与量の決定には使用しないでください。

0D lumped-parameter modelであるため、3D血流、局所壁運動、患者固有形態、
詳細な自律神経・臓器連関などは表現しません。数値結果は検証対象であり、
固定された生理定数や臨床的事実ではありません。

## 開発

前提:

- Node.js 20以上
- npm

```bash
npm install
npm run dev
```

主要な検査:

```bash
npm run typecheck
npm run check:repository-hygiene
npm run test:fast
npm run test:pr
npm run build
```

テストsuiteの登録整合性:

```bash
npm run test:suites:audit
```

## 主要ディレクトリ

```text
studio/contracts/v2/          Studioの現行domain contracts
studio/application/           authoring command boundary
studio/infrastructure/model/  exact model registry implementation
engine/                       numerical model/runtime
docs/studio/                  Studioの現行設計
docs/myocardium/              V3研究・検証ドキュメント
data/myocardium/              machine-readable research artifacts
__tests__/                    application/runtime tests
```

## 変更方針

- 新しいStudio機能はV2 contractsを経由する
- 旧構造へfallback、dual-write、compatibility aliasを追加しない
- model behavior、schema、codec、catalog、gateが変わる場合は新しい
  `modelId`を登録する
- official contentはregistered exact modelを必ずpinする
- 古い設計が必要な場合は現行ツリーへ戻さず、Git履歴を参照する
