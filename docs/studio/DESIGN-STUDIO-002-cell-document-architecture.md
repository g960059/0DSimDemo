# CircleHeart Studio — 全体設計まとめ

作成日: 2026-07-24
更新日: 2026-07-25
対象: 循環動態 0D シミュレーション webapp の IA / UI / UX / データモデル / runtime / command / 疎結合 interface の再設計
位置づけ: **CircleHeart Studio v1 の Proposed target architecture**。現行 v0.1 UI の段階的延長ではなく、数理基盤を再利用して新しい Studio application を構築するための方向性文書
移行方針: user 0・公開前のため、現行 `CaseDocument` との backward compatibility / dual-write / user-data migration は v1 の非目標。既存 official content は数理モデル確定後に再 authoring し、旧データは回帰試験・比較 fixture として保持
実装状況: runtime foundation（contract / coordinator / exact V4 envelope / Worker host / MainWire adapter）、既存product Workbenchへの初期bridge、session-onlyのcanonical Document Editor / Workbench Briefing compose・capture / Author → Reader Preview縦断スライスは実装済み。Reader Previewは`draft-preview-uncertified`、1 placement / 1 scenario、preview-bootstrap限定であり、certification / publication / 最終Readerではない。Workbench bridgeは実browserで1-point open / parameter commitごとの自動live+strict / 1×描画 / 明示promotion・pinを接続し、波形・PV loopのparameter-generation履歴とsettled source由来のpersistent Worker Guyton/Starlingを表示する。WorkbenchとReaderのgraph paneは同じrendererを使い、Briefing captureはwindow・色・凡例位置等をportable snapshotとして固定する。ただしDocument / Experimentはsession-onlyで、最終Study Lab、durable project、multi-placement Reader、certification / publicationではない。§17 の性能検証とaggregate N-branch session、§19 の残る規範別紙・product contextは未完であり、本書のtarget全体をUI実装済みとは読まない

想定ユーザー: 初期研修医・ME 等の beginner 5割 / 循環器・麻酔科の後期研修医・専門医 4割 / 循環動態研究者 1割（9割が非エンジニア）

---

## 0. エグゼクティブサマリー

- **役割で画面を割らない。** ユーザーが扱う content root は **Experiment** と **Document**。ドメイン identity は `Experiment / CellPlacement / SimulationSession` に分け、read → interact → compose は別 product への移動ではなく同じ content に対する capability と extent の変化で表す。
- **presentation context は3つ**: Reader / Study Lab / Document Editor。別々の所有モデルを持つ surface ではなく、同じ object model と application API の投影。Experiment 作成は独立 Editor ではなく Study Lab 上の一時 **Presentation Compose Layer**。
- **構成は引き算でなく足し算**: `Catalog → Working Set → Brief` の3段。どの extent も「全部見せ」ではなく、上位から pin して作る選択。
- **runtime は二重経路**: 前景 live transition（1× 生理時間）+ 背景 strict steady job（最大速）。parameter 変更ごとに両方を自動開始し、古い job は generation 不一致で破棄する。steady candidate へ自動ジャンプしない。
- **描画は settled / certified snapshot の1 pointから開始**し、波形・PV loop・beat metricを前向きに形成する。MainWire envelope は exact checkpoint V4 + resolved simulation-input ref + 同revision/timeの完全なseed observable 1 pointだけを持ち、last-beat sample は canonical artifact に保存しない。
- **certification用の重いV&Vはsnapshot単位**で行い、Assessmentを`subjectHash × assessorVersion × profileVersion`で再利用する。Composeやprivate revisionのmaterialize自体はV&Vの実行契機にせず、certify / official Publishが有効なrequired Assessmentの存在をgateする。Readerは完全V&Vを走らせない。
- **疎結合**: Presentation → Application(Command/Query/Event) → Port → Model/Runtime/V&V実装。engine内部型はpresentationに漏らさない。control planeはserializable contract / ref、binaryと高頻度streamは分離したdata planeで運ぶ。
- **versioning は二層**: command log（diff / undo / AI / provenance）+ materialized snapshot（再現性 / pin）。engine には event-sourcing を持ち込まない。
- **1 Experiment = 1 model+version。** モデル間比較は当面提供しない（必要なら別 cell）。
- **数理基盤とStudioをsoftware projectとして分離**する。Model Platformはmodel package / runtime / state codec / assessor、StudioはExperiment / Document / certification / publication / UIを所有し、両者はversioned contractだけで接続する。

---

## 1. 問題

現行 webapp は「Workbench」という1画面に、(1) シミュレーション探索の作業場、(2) 再利用可能な Experiment 作成、(3) Article 執筆、(4) 学習者向け提示、(5) AI 対話、の全部を担わせようとしており、以下が繰り返し発生していた。

- **「どこで作るか / どっちが所有するか」問題の再発**: Experiment Editor は Study Lab と Document のどちらが所有するのか、Article はどこで作るのか、note pane が作業場としても Experiment 作成の場としても不足、AI をどこに置くか。
- **free-tile か role-based area かの二択に見えて解けない**: 祖先は「全部が編集可能な tile を敷き詰める1枚」だったが、controller/note pane の scroll が辛く role area + dockview に割った。しかしそれは実装都合であって思想ではなかった。
- **mobile への畳み方が出発点なのに、role area も free-tile も mobile で成立しない。**
- **presentation と数理モデルの結合**: engine が別 lane で進化（coronary / mechanical support / rhythm 統合中）しているのに、presentation がそれに巻き込まれる懸念。
- **MCP / LLM 自動化**をどう組み込むか、interactive widget を外部にどう配信するかが未整理。

### 根本原因

役割（consume / explore / author）で surface を割っていたこと。役割は連続的に移り変わる（読んでいて触りたくなる、触っていて残したくなる、残していて書きたくなる）のに、役割で壁を立てると、その壁を跨ぐたびに「どの surface か / どっちが所有か」が生まれる。

---

## 2. 背景（引き継ぐ資産）

- **数理モデル**: time-varying elastance / active-stress、Land ベース心筋、AV-plane、biphasic MVF、LA figure-8 等。coronary flow / mechanical support / rhythm まで統合が完了間近。**これがこのサービスの核であり最大の資産。**
- **graph renderer / clinical knob / case serialization / validation tool・artifact** も再利用候補の資産。ただし現行 case 保存は immutable revision model ではなく、新 Studio の versioning / publish 基盤とは区別する。
- runtime 基盤の一部は既存: model state の schema/version/hash 付き serialization、live parameter を core に適用しながら時間積分する経路、背景 transition-steady job。現在の自動 promote は新設計と逆なので外す必要がある。
- 現行 `CaseDocument`（instances / solver / views / graphBoardLayout / notes / reading / exposedControllers）は、新schema設計・fixture・局所的な実装再利用の参考になる。ただしproduction data modelを互換移行する前提にはしない。
- 既存 ADR「BlockNote 内部形式を canonical にしない」は継承する。

数理モデルの完成度・科学的 acceptance と、Studio の software architecture readiness は別に追跡する。**再利用するのは数理 kernel と検証資産であり、scientific publication gate が既に完成しているとは仮定しない。**

**再考すべき中心は計算式そのものではなく、それをどの単位でユーザーに届け、どの単位で作成・保存・共有するか。** シミュレーターからプラットフォームへ抽象度を一段上げるタイミング。

### 2.1 software project 境界

```
CircleHeart Model Platform
  model packages / Simulation Runtime / state codec / capability manifest
  numerical steady solver / assessor・gate implementation / CLI・worker

@circleheart/contracts
  ModelRef / SimulationInputSpec / SnapshotEnvelope / SignalBatch
  RuntimeCommand・Event / AssessmentRequest・Report

CircleHeart Studio
  Project / Experiment / Document / SimulationSession
  artifact metadata / certification・publication policy / Reader・Lab・Editor
```

- Model Platform は `Project`、`Document`、ユーザー権限、publish を知らない。
- Studio は `ModelCore`、provider、solver 内部型を import しない。
- まず monorepo 内の独立 package と依存方向で境界を実証し、チーム・release cadence・deployment が独立した時点で repository 分割を判断する。
- これは全面スクラッチではなく、**brownfield の数理基盤の上に greenfield の Studio を構築する**方針。
- 現在成立しているのはsoftware project / dependency境界であり、物理repositoryやdeploymentが既に分離済みという意味ではない。

---

## 3. 解決の中心思想

> **役割ごとに別 product / ownership model へ飛ばさない。ユーザーが扱う content root は Experiment と Document。read / interact / compose は、同じ content に対する placement・extent・capability・persistence・runtime の組み合わせで表す。**

これにより「どこで作る / どっちが所有」問題が構造的に消える（跨ぐ壁がないから、跨ぐときの「どっち」が発生しない）。

### 中心原則（直交する状態次元）

「全部 extent に畳む」は綺麗すぎた。実装では次を混同しない:

```
Extent       : inflow | peek | fullscreen                （空間の占有量）
Capability   : read | interact | compose                  （何ができるか）
Placement    : standalone | document                      （Document 内か単独か）
Persistence  : scratch | project-draft | revision          （保存形態）
Session      : live | closing | closed                    （aggregate lifecycle）
Branch       : running | suspended                        （前景playback）
Publication  : PublicationManifestRef[]                    （revisionへの別association）
```

background strict steady job は排他的な Runtime enum に入れない。parameter 変更ごとに `targetGeneration` を進めて自動実行し、未消費の `latestSteadyCandidate.generation === targetGeneration` の時だけ現在値に対応する candidate とみなす。古い結果は保存状態を `stale` に変えるのではなく、generation 不一致で破棄する。`certified` は runtime 状態ではなく `CertifiedSeed` という永続 artifact。

branch laneのterminal outcomeは`success | failure | superseded | aborted`。新generationによるsupersedeとsession closeによるabortは正常なlifecycle完了であり、aggregate Promiseをrejectせず、数値failureとして表示しない。failureはsession lifecycleやplayback状態と別に保持する。

`published`はPersistenceの値ではない。immutable revisionを`PublicationManifest`が参照して公開するassociationであり、同じrevisionを複数channel / editionから参照できる。

例: beginner が fullscreen で開いても `Capability = interact`（compose 不可）。fullscreen は extent であって compose 権限ではない。

---

## 4. オブジェクトモデル（identity）

"cell" は UI 上の短い呼称としてのみ残し、ドメイン identity では3つに割る。

```
Experiment (Draft mutable → Revision immutable)   ← 再利用可能な科学的 unit。Project が所有
CellPlacement                                     ← Document 内の配置。Experiment への参照 + 局所設定
SimulationSession (ephemeral)                     ← 読者/探索者が今操作している集約（N ScenarioRuntimeBranch）
```

- **1 Experiment = 1 model+version、全 scenario 共有。** モデル間比較は当面しない（author が別 cell で目視比較）。これにより cross-model の comparison adapter / binding mapping は不要。
- **publish は単数 run ではなく `scenarioId → RunArtifact` の集合を pin する**（multi-scenario）。
- 同じ Experiment を A 記事 = inflow / B 記事 = peek で使い分けできる（CellPlacement が inlineMode を持つ）。
- `cell` は、Document 内では `CellPlacement`、standalone では Experiment の renderer を指す UI shorthand。永続型名には使わない。
- **1 SimulationSession = 1 Experiment interaction + N ScenarioRuntimeBranch**。各branchが数値state、buffer、`targetGeneration`、steady candidateを持ち、session-level commandが対象branch集合へatomic intentを発行する。N個の独立SimulationSessionをUIで束ねる設計にはしない。

現在のproduct Workbench bridgeは、このtarget aggregateへ到達する前の
暫定縦切りである。表示scenarioごとに独立したcoordinatorと
`SimulationSession`を作り、presentation registryで束ねているため、
multi-scenario intentはsession-level atomicではない。これはtarget変更ではなく、
明示的な未完事項である。Workbench shell、chart / panel、既存presentation DTO、
`ScientificWorkbenchResearchControlStoreV0`もUI adapterとして一部再利用するが、
旧Workerや旧controllerを数値ownerへ戻すfallbackは持たない。これらのlegacy型は
Studio domain contractではなく、最終Study Labへ向けて縮退・置換するbridge debtである。

### scratch の生成・保存境界

- Cases / Home からの使い捨て開始時に存在するのは `SimulationSession + ephemeral ExperimentDraft`。hidden `DocumentDraft` は作らない。
- 「Experiment として保存」で Project と durable `ExperimentDraft` を作る。
- 「Document に追加」または text / 2個目の Experiment を追加した時に初めて `DocumentDraft + CellPlacement` を作る。
- `n=1・text 無しの Document` は有効だが、standalone scratch と presentation 上同じに見えるだけで、同じ durable object ではない。

### 永続 / 一時の分離

```
永続: Project / RunArtifact / AssessmentReport / CertifiedSeed /
      ExperimentDraft → ExperimentRevision / DocumentDraft → DocumentRevision /
      PublicationManifest
一時: SimulationSession / WorkspaceState（pane 位置・drawer 幅・scroll・active tab）
```

---

## 5. IA / presentation context

トップは目的で3つ。中身は同じ object model / application shell の異なる presentation context。

```
CircleHeart
  学ぶ Learn        公式 document を読む・触る（beginner 主導線）
  症例 Cases        症例/介入から standalone scratch を即開く（臨床家 主導線）
  自分の Projects    作った document / experiment / run（author・研究者）
```

- **Investigate は独立 product にしない**: 「調べたい」= standalone scratch Experiment を Study Lab renderer で開く。
- **Experiment Editor は独立 destination にしない**: Experiment の探索・構築は Study Lab、読者向け提示の構成はその上の一時 compose layer。
- **note pane は廃止**: 文章は Document の text block に吸収。

Reader / Study Lab / Document Editor は別 ownership model を持つ silo ではない。Learn / Cases / Projects は、どの content をどの placement・extent・capability で開くかを決める入口。

### 3つの presentation context

1. **Reader**: 公式記事・Lesson・共有 Document を読む・限定的に触る。
2. **Study Lab**（旧 Workbench の後継）: 探索と Experiment 構築。graph board（spatial）/ controller inspector / metrics inspector / scenario manager。
3. **Document Editor**: text block と Experiment 参照（CellPlacement）を順に並べる block editor。

現行session-only sliceの`StudioDocumentBlockEditorV1`は、旧note paneやBlockNote JSONを中間canonicalにせず、Studio Document ASTのtitle / H2・H3 heading / paragraphを直接編集し、Experiment placementをatomicなstructured refとして順序付ける。commitはtitleとordered blocksを1つのapplication transactionで置換し、draftとDocument revisionを1回だけ進める。staleな`expectedRevision`または不正なdocument graphは部分反映せず拒否する。これはDocument Editor seamの本実装だが、durable save、multi-placement authoring、asset/citation、共同編集、publishまで実装済みという意味ではない。

---

## 6. UI / UX

### 6.1 cell（UI shorthand）と extent

- Document 内の **cell** は `CellPlacement` の renderer。`inflow → peek → fullscreen` の3 extentを持つ。
- primary gesture は「開く / 元の位置へ閉じる」。既定の開き先は desktop reader では peek、mobile では semantic peek の full-screen sheet。さらに「Study Labで開く」で fullscreen に進める。
- standalone Experiment は最初から fullscreen でよい。Document は `CellPlacement` と text の順序列で、**n=1・text 無しも許す**。
- suspended / live は自動の性能状態で、authoring capabilityとは別。ユーザーにモード選択として見せないが、「試行中」「最初のbeatを集計中」等の観察に必要な状態は表示する。

### 6.2 extent（Reader の3種）

- **inflow**: 記事内に直接埋め込み。soft limit = graph 1 / metric 2–4 / control 0–2。certified snapshot の1 pointを描いてから1×でtraceを前向きに形成し、触れた瞬間にcontrolを有効化。live inflow は1セクション1本まで（積分ループ予算）。
- **peek**: desktop では side sheet（`width: clamp(560px, 54vw, 960px)`、記事を背後に残す、同じ Session を維持）、mobile では full-screen sheet。graph 2–4 / metric 4–8 / control 1–4。Explain / Evidence タブ追加可。
- **fullscreen**: Study Lab renderer を使うが、Reader capability では layout 変更不可・graph 追加不可・brief 編集不可・未 expose の raw control は非表示。「作者モード」ではなく、広い画面で Working Set を interact する extent。
- **launch**: brief 未作成 or 重い場合の静止プレビュー + 開くボタン。thumbnail は certification / publish 時に生成できる非canonicalな derived cacheで、科学artifactではない。cache が無ければ model / Experiment の placeholder を表示する。

### 6.3 1-point start の表示契約

- `CertifiedSeed` は可能なら end-diastole 等の model-defined canonical phase で作る。phase 自体も `SnapshotEnvelope` に含める。
- MainWire v1の`SnapshotEnvelope`は、control-aware exact checkpoint V4、そのcheckpointのbase input digestに対応するresolved simulation-input artifact ref、checkpointと同じrelease / accepted revision / accepted timeの完全なseed observable frame **1点だけ**をcanonicalに持つ。open / promoteの初期描画で数値stepを追加しない。
- waveform は1 pointから伸び、PV loopは最初の1周期で閉じる。過去1 beatを捏造・補間して即時完成形にはしない。
- beat metric は最初の完全なbeatが終わるまで「集計中」。低HRを含め、この待ち時間はsimulationの観察時間として扱う。
- parameter変更時は、incoming generationのwaveformが設定windowを満たすまで直前generationを低いalphaで残す。新旧両方を一時的なdomain計算へ含め、空のgraphへの切替とautoscaleの不要な揺れを避け、windowが満ちた時点で旧waveformを原子的に外す。
- PV loopの**parameter-generation履歴**は同一generation内のbeat履歴と別の表示契約とする。現行paneは`0 / 1 / 3 / 5 / 6`（既定`6`）から選択し、古いgenerationをageに応じて薄くし、選択上限を超えたものを除去する。履歴loopも保持中はdomain計算へ含める。
- Reset は同じ certified 1 pointへ戻り、同じ形成過程を再開するtarget contract。現Reader Previewは同じimmutable manifestから数値sessionを完全に再生成してこの契約を満たす（逆parameter patchでは代用しない）。再利用可能なheadless in-session Reset commandは引き続き未実装。
- last-beat sample、beat history、window metric、presentation stateはcanonical保存しない。thumbnail等のderived display cacheは再生成可能で、正しさの根拠にしない。

### 6.4 展開/収束の craft（このプロダクトの成否の中心）

| 項目 | 値 | 理由 |
|---|---|---|
| 展開 transition | shared-element: cell が流れ上の自分の位置から拡大 | 「どこから来たか」を身体で覚える |
| easing | `cubic-bezier(0.32,0.72,0,1)` / enter ~350ms | iOS drawer 曲線。ease-in 禁止 |
| collapse | ~200ms、enter より速く、必ず元位置へ | 応答は snappy・空間記憶を保つ |
| document 所属 cell を fullscreen 化 | 上端に薄い breadcrumb `‹ RV failure · 3/7` + 端に document minimap | 「流れの一部」を条件付きで示す |
| n=1 scratch | 何も出さない（流れが無い） | 信号は必要な時だけ |
| dismiss | drag + velocity > 0.11 | 距離閾値だけにしない |
| `⌘K` 等キーボード操作 | 無アニメ | 高頻度動作を遅く感じさせない |
| ボタン | `:active` scale(0.97) 160ms | 応答フィードバック |

原則: **戻り先を常に感じさせる。** `prefers-reduced-motion` で移動系を落とし opacity/色は残す。

---

## 7. 構成の作り方（Catalog → Working Set → Brief）

3段の入れ子で、各段が親から **足し算（pin）**で作られる。引き算（全部から削る）は一度も発生しない。

```
Catalog（= model が申告する全候補: signals / metrics / params / graph types / interventions / capabilities）
   ↓ add（探索。誰でもやる。metadata 無し）
Working Set = fullscreen / Study Lab の 1 Experiment
   ↓ compose（オーサリング。任意。author のみ。pin + rank）
Brief = peek / inflow
```

- **fullscreen（Working Set）自体が catalog からの足し算選択。** 「全部見せの正典」は存在しない。remove も自然（= 自分のセット調整 = 探索）。
- **Presentation Compose Layer**: Study Lab 上の一時 layer。author が明示的に「Presentation」を押した時だけ入る。graph/metric/control に `+ Add to In-flow / Add to Peek / Set as primary` を出す。閉じると workbench には authoring 表示を一切残さない（臨床家の workbench は星ゼロ）。
- **brief ↔ graph は参照でなくコピー**: pin 時に view spec を snapshot コピー。author が後で board の graph を編集しても brief は追随しない（immutability 一貫）。「brief 更新」は明示アクション。
- **brief は純 cutoff ではなく per-extent presentation**: inflow と peek それぞれに配置を持つ。既定は peek が inflow を継承、必要時のみ上書き。→「peek で 2×2 自由配置」と「ranked」が両立。
- **優先順位は拾った少数（3–4個）にだけ持たせる。** 全体（20 param）を sort しない。

現行の最初の実装sliceでは、Workbench headerから明示的に**Briefing**を開き、waveform / PV loop / Guyton-left / Guyton-right paneをcapture・update・remove・capture-allできる。閉じるとcompose layer自体がunmountし、通常の臨床家Workbenchにpane-levelのauthoring affordanceを残さない。captureはlive paneへの参照ではなく、`StudioGraphPaneSpecV1`へ次を解決したdetached copyである。

- scenario / itemの明示identity、表示名、実効color
- waveform window、legend表示とfractional position
- PVのguide、beat履歴、parameter-generation履歴、pressure basis、relation設定
- Guyton/Starlingのdetail、parameter履歴、negative filling pressure設定

Readerはこのportable snapshotからread-only `PanelDef`を再構成し、Workbenchと同じ`ScientificProductGraphPaneV1`を使う。したがってReader専用の別waveform SVGや別PV/Guyton実装は持たない。runtime frame、candidate、Worker job、settings-open状態、Dockview geometryはcapture対象外であり、Workbench側の後続編集は明示的なupdate captureまでReader briefへ伝播しない。このsliceは1つのReader inflow用graph pane列までで、targetのper-extent layout、metric/controller compose、multi-scenario binding全体を完了したものではない。

### custom graph / metric / controller

3つではなく「catalog の1名前空間（signal / scalar / param）からの順序つき選択 + 提示」という単一 primitive。全 pane の本質であって、重い「作成儀式」にしない（名前を付けて保存は再利用のための任意オプション）。custom button（label + preset）は control affordance の一種として正式扱い（transition policy に接続）。

### perf の本当のコスト単位

基本仮説は、graph/metric が sim 出力の射影であり、**計算コストの主成分は同時に live な scenario 数**、描画コストの主成分は画面に見えている live chart 数、というもの。他 tab の chart を描画しない構造を描画予算の制御に使う。ただし derived metric / 3D renderer / browser実装によりコストは変わるため、§17 spike で対象端末・N scenario・visible chart数・frame time・memory・resume latencyを測り、仮説を性能契約に変える。

---

## 8. graph board のレイアウト（spatial / non-spatial）

「role area か free tile か」は偽の二択。要素を **spatial か non-spatial か**で割る。

| 要素 | 空間的意味 | 扱い |
|---|---|---|
| graph | 有り（RV/LV, 上下, 2×2 が意味） | author が置く board（split/自由・recursive）。配置は content として保存 |
| controller | 無し | inspector のリスト（category / search / collapsible / scenario binding） |
| metric | 無し | inspector のリスト / readout |

- graph board だけ author 配置（recursive split tree でよい）。controller/metric は inspector（完全自由 tile に戻さない）。
- 「recursive layout 却下」は *brief presentation*（recipe/cutoff）の話。graph board 自身は recursive split でよい。両者は別レイヤー。
- **組織単位は scenario ではなく graph**（= どの signal を・どの scenario 群を重ねるか の1比較）。board を scenario でグルーピングしない → 入れ子サブグループも 1-graph-multi-scenario の矛盾も発生しない。

### mobile

content（全 graph にアクセス）と layout（2×2 の空間的意味）を分けて考える。
- layout（空間的意味）は phone では生存不可能 → 諦める。
- content は保存 → 空間ではなく逐次（tab/swipe でページング。減らさない）。
- **reader on mobile** → brief（inflow/peek の full-screen sheet）。少数で正しい。
- **explorer on mobile** → Working Set 全部を swipe ページング。減らさない。
- 分岐は role ではなく reader 文脈（document 内）か explorer 文脈（workbench 直）か。

---

## 9. runtime（前景 live 1× / 背景 strict steady）

- **表示は 1× 生理時間。計算だけ背景で高速。** 加速表示は HR 変化に誤認され、波形の形を歪めるため不採用。
- **二重経路は parameter 変更ごとに自動開始**: 前景 live transition（現在stateから連続積分）+ 背景 strict steady job（同じtarget inputを最大速で厳密収束）。
- parameter変更のたびにscenarioごとの `targetGeneration` を進める。古いjobはcancel可能ならcancelし、完了してもgeneration不一致なら破棄する。`stale / available` をユーザー状態として保存しない。
- schedulerは連続drag中の未開始jobをlatest-winsでcoalesceしてよいが、generationは各target変更で進め、操作停止後の最新targetに対するjobを必ず開始する。「自動再計算」のsemanticと「全pointer eventを完走させる」を同一視しない。
- UIからの部分変更は最新のdesired targetへmergeしてからruntimeへ渡す。runtime commandの`values`はmodel catalog全件のcomplete exact mapであり、古いgenerationがaccepted branchへ到達したかどうかに次のtarget解決を依存させない。
- **最新targetに一致するsteady candidateへ自動ジャンプしない。** 明示ボタン + beat境界phase合わせでpromoteする。candidateの有無は未消費の `latestSteadyCandidate?.generation === targetGeneration` から導出し、promotion成功時にそのephemeral candidateを消費してclearする。
- MainWire adapterはscenario branchごとに専用live Workerを所有し、各targetのstrict jobには別の排他的Worker leaseを割り当てる。1 Worker内のcommand queueでstrict settlementが前景liveを直列blockしない。N branch intentでは全branchのlive / strict cloneを同じaccepted boundaryから準備し、全branch barrierを越えるまでどちらのlaneも進めない。
- strict candidateを認めるのは`period1-converged ∧ periodicSteadyStateClaimed ∧ !period2OrbitSuspected`の時だけ。retained closure evidence、completed beat count、anchor、P1 classificationをexact checkpointのperiodic tracker、boundary transaction、terminal transactionへ相互拘束し、0-beat claimやidentityだけ整ったcheckpointは拒否する。このP1 admissionは数値steady / healthの判定であり、morphology・conservation・case-specific validationを含む完全Assessment / Certificationではない。
- metric は「最後に完了したbeat」から。session開始直後は§6.3の通り「集計中」。
- **multi-scenario live transition**（中核ユースケース = Ees の baseline vs HFrEF）: N 本の scenario をそれぞれの certified snapshot から同時温間再開し、同一 graph に 1× で重ねて描画。共有 knob（binding = all）を動かすと N 本すべてに atomic なpatch intentを発行し、背景 strict steady job もN本自動開始。
- liveの高頻度pointはbranch-bound signal channelで1×配信し、control plane / domain logには積まない。pacingは累積wall/model-time deadlineで短い遅延をcatch-upし、黙って許すlag上限をcanonical 1 cycle（現releaseは1,000 ms）として事前宣言する。上限超過時は遅いtraceを1×と表示し続けず、current-epoch failureとしてbranchをfail-closed suspendする。suspendはaccepted command boundaryまで待ち、resumeは同じaccepted stateとstream epochから継続する。target変更・promotionはcoordinatorが新しい1-point stateをinstallした後に新stream epochを明示activateする。current-epochのWorker failure、malformed batch、sequence gap、metric regression、observer callback failureは既存signal failure channelで原因を通知してbranchをfail-closed suspendし、observerを無言detachせず、明示的に古いidentityだけを破棄する。strict Worker leaseはpresentation suspendから独立して進む。
- **density = 性能予算のダイヤル**: viewport内でlive予算に選ばれたIn-flowは、未操作でも自動live化して1 pointからtraceを伸ばす。画面外または予算外のCellPlacementはcompact（engine停止・1 point / thumbnail）にし、viewport進入または操作でlive slotを取得する。1セクション1本の優先規則とslot evictionは規範別紙で固定する。branch-level suspend / resume contractは実装済みだが、IntersectionObserverとのUI接続とslot policyは未実装。
- **control transition の二分**:
  - `RuntimeUpdatePolicy`（数値安定・UI 表示のための反映規則: applyAt immediate/nextBeat/endSystole/endDiastole/restart、visualTransition ramp、overridePolicy allowed/locked）
  - `PhysiologicInterventionProtocol`（検証済みモデルがある時だけの科学的時間発展: 輸液速度・薬物動態・出血・補助循環起動）
  - 両者を同じ型に混同しない。model catalog が既定を申告、author が上書き（locked は不可 = 物理強制）。
- Reader の ad-hoc slider 操作は RunArtifact に保存しない・完全V&Vしない・科学artifactにしない。保存する場合は最終target inputを新しいDraftへforkし、自動settle → required Assessment → 新しいCertifiedSeedという通常経路を通す。
- authorが教材・症例として定義する `PhysiologicInterventionProtocol` は、実装時にはpath-dependentな科学contentとしてExperimentRevisionにversion pinする。輸液・出血・薬物動態等を最終targetだけに潰さない。**v1は型名・hash extension pointのみを予約し、protocol authoring / execution / certificationはpost-v1**とする。

---

## 10. V&V / Certification（3 artifact に分割）

3つの "検証" を分離する。
- **(A) 完全 Assessment**（morphology / conservation / case-specific scientific validation）= 重い。immutable snapshotに対して実行し、Readerでは走らせない。
- **(B) 背景 strict steady job**（数値収束の探索・判定）= parameter変更ごとに自動実行。(A)のscientific Assessmentとは別物。
- **(C) published/final Reader の baseline** = pin 済み certified snapshot をそのまま初期条件に。published/final Reader は V&V を一切計算しない。session-only の draft Reader Preview は明示的な uncertified 例外であり、publication-ineligible のまま扱う。

Assessmentはimmutableなsubjectに対するjobである。certification gateのsubjectは単一snapshot、sweep / cross-scenario comparison等の研究用途ではartifact setをsubjectにできる。cache keyは`subjectHash × assessorRef × profileRef`。Composeとprivate revisionのmaterializeはpresentation / versioning操作であり、V&Vの実行タイミングではない。certify / official Publishは、対象snapshotに必要なAssessmentが揃っているかを確認し、不足分だけjobを要求する。

artifact昇格は次の4段を混ぜない。

1. `steady candidate`（ephemeral）: 最新generationに対するstrict job出力。
2. `pinSteadyCandidate` → `RunArtifact`: numerical steady / healthを確認してimmutable計算結果を作り、必要ならExperimentDraftへ参照を付ける。Assessmentはまだ不要。
3. `certifyRun` → `CertifiedSeed`: EffectiveCertificationPolicyのrequired Assessmentを満たす時だけ作る。
4. `official Publish` → `PublicationManifest`: 公開対象の全scenarioが要求するCertifiedSeedとrevisionを原子的に参照する。

`promoteSteadyCandidate`は表示中SimulationSessionをcandidateへ明示的に切り替えるSessionCommandで、`pinSteadyCandidate`とは別である。private ExperimentRevisionは未certified RunArtifactを含めてmaterializeできるが、official / certifiedと表示しない。

steady candidateは`numerical steady ∧ numerical health`を満たせばRunArtifactとしてpinできる。これは再現可能な計算結果の保存であってcertificationではない。CertifiedSeedへの昇格はさらに**`EffectiveCertificationPolicy.requiredGates` pass**を必須とし、`advisoryGates`はwarningとして残す。異常症例がnormal range外であることとscientific validation failureを混同しない。morphology、gradient、regurgitant fraction、source equation、expected findings等はprofileに応じてrequiredにできる。

`CertificationPolicy`はauthorが安全条件を自由に弱めるための設定ではない。model packageはversionedな`MinimumCertificationProfile`（non-bypassable numerical / applicability gates）を申告し、content policyはrequired gateを**追加**できるが削除できない。`EffectiveCertificationPolicy = model minimum ∪ approved content policy`とし、official publishは承認済みimmutable PolicyRevisionだけを受け付ける。個人Draftの探索結果はこの承認なしでも保存できるが、certified / officialとは表示しない。

```ts
RunArtifact      = { contractRef, modelRef, runtimeRef, solverRef, stateCodecRef,
                     input, initialSnapshotRef, protocolRef?, convergencePolicyRef,
                     inputHash, snapshotRef, snapshotHash,
                     steadyStatus, numericalHealth }
AssessmentReport = { subject:{kind, refs: ArtifactRef[], subjectHash},
                     sourceRunRefs: RunArtifactRef[],
                     assessorRef{id,version}, profileRef{id,version},
                     kind: "verification"|"validation", results: GateResult[] }
CertifiedSeed    = { runId, snapshotRef, snapshotHash, canonicalPhase,
                     certificationPolicyRef, requiredAssessmentReportIds[] }
```

- Run（実行結果・immutable）と Assessment（検証結果）と CertifiedSeed（使ってよい IC）を分ける。immutable Run に後から vv ref を貼らない。
- identityはAssessmentReport（どのimmutable subjectを、どのassessor/profile versionで評価したか）。Certificationに使えるのは対象RunArtifactのsnapshotHashをsubjectとするreportだけ。UI URLやjob実行画面はidentityではない。
- `SnapshotEnvelope` はmodel/runtime/stateCodec version、phase、ODE state、warm restartに必要な補助runtime stateを含むopaque payload。display bufferは含めない。
- RunArtifactからsessionをopenする時はrefの存在確認だけで済ませず、canonical contentのinput / snapshot / target digest / execution identity / claims / parent Run lineageがopen sourceと一致することをWorker割当て前にfail-closed検証する。
- **波形sampleと詳細metricはcanonicalに保存しない**。Readerはcertified 1 pointから前向きに再生成する。scalar summary / thumbnailは任意のderived cacheで、run一覧・launch表示にだけ使う。
- settled snapshotは捨てない。V&V対象かつReaderの温間再開点。
- 公開済みExperimentが依存するmodel/runtime/state codec versionは、公開物の保持期間中、実行可能なversioned packageとして保管する。derived cacheだけを再現性のfallbackにはしない。
- scenario/input、snapshot、assessor/profileのどれかが変われば旧Assessmentは削除せず、現在revisionに対して不適合な過去artifactとして残す。certificationは新しいhash集合に対して再取得する。

---

## 11. catalog / model

- **`catalog = f(modelId, modelVersion)`。** coronary / mechanical support / rhythm の有無でモデルが出せる signal/param/metric/intervention が違う。catalog は model が申告する capability manifest から導出。
- **Experiment は model+version を pin する。** catalog 版差で参照が宙に浮くのを防ぐ。「モデルを新版に上げる」は自動でなく明示upgradeとして新Draftを作る。
- model package が持つもの: signals / derived metrics / params（range・unit・既定 transition policy・locked）/ clinical knobs / 利用可能な解析 / 既定 controller set / 既定 metric set / 既定 graph preset（`rendererKey` 宣言）/ assessor・gate定義 / model-level default profile / state codec。
- Studio/content 側が持つもの: 症例別 `CertificationPolicy`（required/advisory gate選択）/ expected findings / publication policy / 各 renderer（waveform / PV loop / curve / metrics card）/ UI / layout / presentation recipe。
- model側の`MinimumCertificationProfile`はnon-bypassable。Studio/contentのPolicyRevisionはrequired gateを追加できるが、minimumを削れない。official publishには承認済みPolicyRevisionを要求する。
- **「engine 機能追加時に presentation 変更ゼロ」は言い過ぎ**: 既存 renderer で描ける新 signal/metric なら変更ゼロ、新しい可視化文法が要るなら renderer plugin 追加が必要。
- custom view は catalog item への versioned reference を持ち、既定 preset から copy-on-write（preset を後で変えても既存 Experiment の表示が勝手に変わらない）。
- publish時にcatalog manifest hash、renderer contract / bundle ref、briefで使うlabel・unit・display metadataをpinまたはmaterializeする。公開revisionは「現在のcatalog」に暗黙依存しない。保持期間中は該当manifestとrenderer実装を実行可能に保つか、明示的な互換adapterを提供する。

### 11.1 ParameterSet と preset

presets と patient fitting を「fitting」で一括りにしない。

- **preset は成果物**: model/versionに紐づく名前付き `ParameterSet`。作り方は手置き、target-driven探索、patient fittingのいずれでもよい。
- **v1のpresetは手置き**: authorがStudy Labでclinical knob / paramを調整し、説明・適用範囲・provenanceとともに保存する。fitting基盤に依存しない。
- **target-driven presetはv1.5**: LVEF≈30%等の少数scalar targetに合わせる軽量探索。patient dataではなく、結果は`target-matched / heuristic`と明示する。free parameter数・range・regularizationをmethodとしてversion化し、複数解がある時に一意な生理状態と称さない。
- ParameterSetをScenarioへ適用しても自動でcertifiedにはならない。通常どおり自動settle → required Assessment → CertifiedSeedを通す。

```ts
ParameterSet = {
  id, modelRef, values, units,
  provenance: "authored" | "target-matched" | "fitted",
  publicSourceRefs: ArtifactRef[],
  exportSafeProvenance?, limitations: string[], createdAt
}
```

`ParameterSet`はportableな成果物なので、PHI storeをdereferenceできるrefを含めない。future fittingの`ObservedDatasetRef`等との完全lineageは、privateな`SensitiveFittingLineage`が`parameterSetId`へ別途紐づける。

### 11.2 patient fitting（post-v1）

patient fittingはforward modelを候補inputごとに反復実行する逆問題で、Model Kernelを再実装する必要はない。一方、production機能としては最適化、objective/likelihood、compute scheduling、identifiability、UQ、held-out評価、data governanceを含む独立subsystemであり、「Portを1本足すだけ」とは見積もらない。

post-v1では、optimizer / job orchestration / PHI gatewayをserver-sideのFitting serviceとして置き、StudioはFittingPortだけを呼ぶ。Fitting serviceはSimulation Runtime / Assessmentを利用するが、Model Kernelへ逆問題の都合を持ち込まない。PHIを扱うdeploymentは通常のModel Platform workerとはcredential・network・audit境界を分ける。

```
observed data + free/fixed param + objective
  → candidate input
  → batch forward executorでsettle
  → versioned ObjectiveEvaluatorでresidual
  → 探索を反復
  → FittingResult（候補・不確実性・lineage）
```

- interactiveな`run → snapshot → AssessmentReport`を候補ごとにそのまま生成すると、optimizer内側loopのtransport / storage / job overheadとartifact数が破綻しうる。Model Kernel、steady solver、assessorの計算primitiveは再利用するが、候補評価はFitting job内部のbatch executionとし、全候補を公開RunArtifact / AssessmentReportにしない。
- checkpoint、random seed、objective / method version、探索履歴summaryをFittingResultのlineageとして残す。adopt候補とheld-out / final reviewだけを通常のRunArtifact → AssessmentReport経路へ出す。
- `observed`（実測）、`assumed`（固定前提）、`fitted`（推定param）、`simulated`（forward出力）をdiscriminated contractとlineageで区別し、UIは出所を消して混在表示できない。
- 単一の「最適患者parameter」を真値として出さない。residual、identifiability、uncertaintyを必須とし、held-out dataが無い場合は欠如を明示する。
- `FittingResult` はParameterSetではなく候補。`adoptFittingResult`の明示command後に代表ParameterSetを作っても、posterior/ensemble・CI・method・limitationsへのlineageを失わない。
- fit結果は自動でExperimentや公開波形にならない。**fit → review → adopt → settle → required Assessment → CertifiedSeed**を必ず通す。
- FittingはAssessmentと同じimmutable request → asynchronous immutable resultの外側job patternを使うが、内側の候補評価までAssessmentPortにしない。別Port / serviceとして扱う。
- v1で固定するのは`ParameterSet.provenance`と、未知のversioned artifact / job kindを壊さず扱えるgeneric extension mechanismまで。`FittingRequest` / `FittingResult` / `ObservedDatasetRef` / `FittingPort`のversioned contractは、methodとgovernanceを決めるv1.5 companion specで初めて固定する。使わないinterfaceをv1 contractへ先に焼き付けない。

### 11.3 patient data / PHI 境界

- `ObservedDatasetRef`はprivate patient projectの専用PHI storeを参照し、Experiment / Document / RunArtifactへ生データを埋め込まない。
- publish / embed / general-purpose MCPからPHI storeを到達不能にする。refだけ隠してもdereference可能なら隔離にならないため、store・credential・audit logを別境界にする。
- 外部AIへ渡せるのは、承認されたde-identificationと同意・policyを通ったderived figure / EvidenceBundle / ParameterSetだけ。「parameterだけなら自動的に匿名」とは仮定しない。
- private fitting操作を外部agentに許す場合は、general MCP writeではなく、組織のsecurity/compliance境界内にある明示的に許可されたconnector、scoped token、監査、purpose limitationを必須とする。
- PHIには一般Artifactとは別のDataLifecyclePolicyを必須とし、purpose / consent / retention期限 / legal hold / deletion・tombstone / consent撤回 / backup expiry / audit exportを定義する。derived artifactとexportのlineage graphを追跡し、撤回・削除要求時に再評価 / revoke / 連鎖削除のどれを行うかをpolicyで決める。
- `SensitiveFittingLineage`（ObservedDatasetRef、patient/project identity、完全provenance）はPHI境界内だけに置き、外部へ持ち出す`exportSafeProvenance`（method/version、de-identification状態、limitations等）と分ける。ParameterSetやfigureにprivate refを隠しフィールドとして残さない。
- このlifecycle / consent / lineage仕様はv1をblockしないが、ObservedDatasetを導入するv2のblocking companion specificationである。

### 11.4 fitting phasing

| 段階 | 内容 |
|---|---|
| v1 | 手置きpreset = 名前付きParameterSet。generic extension kindのみ。Fitting contract / 実装なし |
| v1.5 | scalar target-driven preset。Fitting contract v1 + 最小Fitting job |
| v2 | patient fitting。ObservedDataset / PHI store / UQ / identifiability / held-out |

---

## 12. command / event / versioning

**Command-oriented application + immutable revision + audit trail**（完全 event-sourcing にはしない）。

- **DomainCommand（永続・versioned）**: experimentDraft.addScenario / addView / setBoardLayout / setControlBinding / setBrief / setParameterSet / pinSteadyCandidate / certifyRun / materializeRevision / documentDraft.insertBlock / publish。
- **SessionCommand（非永続・runtime 駆動）**: session.openFromRun / applyControlPatch（slider）/ setScenarioBinding / reset / promoteSteadyCandidate / suspend / resume / forkToDraft。
- `applyControlPatch`のたびにruntimeは`targetGeneration`を進め、前景live更新と背景strict steady jobを自動開始する。ユーザーが`requestSettle`する設計にはしない。
- 完了したjobのgenerationが現在値と異なる場合は結果を採用せず破棄する。これは内部整合性規則であり、`stale` / `available`をユーザー向け状態として持つことを意味しない。
- **slider drag を versioned log に積まない。** ad hocなlive過渡はpath-dependentな探索でありcanonicalにしない。canonicalは明示的にpinされたsteady Runのみ。
- ただし、authorが意図したpath-dependent操作は`PhysiologicInterventionProtocol`としてDomainCommandで保存する。探索履歴と公開する科学的protocolを混同しない。
- graph resize 等は pointer move ごとでなく操作終了時に1 command（CommitBoardLayout）。

### versioning の二層（純 event-sourcing の罠を回避）

```
ExperimentDraft = baseRevision の snapshot + 以降の DomainCommand log（append-only）
ExperimentRevision（immutable）= materialize した状態 snapshot + provenance（command 範囲）
                                 + pinned run ids + engine/schema version
```

- **snapshot = 「それが何か」→ 再現性・pin。公開物は snapshot で固定、log の replay で復元しない**（engine 更新で replay 不能の罠を回避）。
- **command log = 「どうそうなったか」→ diff・履歴・undo・AI の提案単位。**
- **undo は log を pop しない**（append-only）。compensating command を追記、または session 内の非永続戻し。
- engine には event-sourcing を持ち込まない（engine は履歴も版も intent も知らない stateless な変換器に徹する）。

### command metadata（v1）

```ts
CommandMeta = {
  commandId, idempotencyKey, actorId,
  source: "ui"|"ai"|"mcp"|"system",
  aggregateId, expectedRevision, createdAt
}
```

`expectedRevision`でDocument EditorとStudy Labの同時編集の上書きを防ぐ（楽観ロック）。`idempotencyKey`で再送による二重materialize / publishを防ぐ。詳細なcorrelation/causationはpost-v1。

### publish transaction

publishは複数artifactの寄せ集めではなく、単一の`PublicationManifest`を原子的に確定するapplication transactionである。

1. 参照するExperimentRevision / DocumentRevision / RunArtifact / AssessmentReport / CertifiedSeedの存在・hash・model/version整合を検証する。
2. `CertificationPolicy`がrequiredとしたAssessmentが、対象snapshotとvalidation profileに対して有効であることを検証する。
3. すべての参照をimmutable IDへ解決した`PublicationManifest`を作る。
4. `expectedRevision`と`idempotencyKey`付きでcommitする。

失敗時は公開revisionを1つも可視化しない。巨大artifact自体は先にcontent-addressed storeへ置いてよいが、未参照blobとして回収可能にし、部分公開を許さない。正確なschema・再試行・garbage collectionは規範別紙で固定する。

### AI / MCP

`DomainCommand[]` proposal → validate → diff preview → user approval → dispatch。UIを直接操作しない。v1はgeneral-purpose MCP writeを提供しない。post-v1で公開する場合もQuery + allowlistされたDomainCommand subsetに限定し、publishはfirst-party review必須、UI操作・PHI store・高頻度signal streamは露出しない。

---

## 13. 疎結合 interface（ port 設計 ）

依存方向: `Presentation → Studio Application(Command/Query/Event) → Contract Ports ← Model Platform adapters`。presentationはengine内部型（SimInstance/core/provider/solver）をimportしない。

通信は次の2面に分ける。

- **control plane**: command / query / event / metadata / artifact ref。plain serializable contractのみ。
- **data plane**: SnapshotEnvelope、波形batch、export fileなどのbinary / stream。control planeでは`ArtifactRef` / `ChannelRef`だけを渡し、実体はtransport別adapterで運ぶ。

「portを越えるものはすべて同じJSON型」とはしない。worker postMessage、server transport、file store、MCPでは帯域・信頼境界が異なるため、同一にするのはcontrol envelopeとartifact identityであり、byte transportそのものではない。

### engine 3 層

```
Model Kernel        : state + input + dt → next state（純粋寄り、履歴を持たない）
Simulation Runtime  : session / buffer / clock / suspend-resume（stateful だが product history は持たない）
Application         : Experiment / Document / 履歴 / 権限 / publish
```

「engine は stateless」は不正確。正しくは「**engine は presentation の履歴・authoring intent を知らない、数値状態以外の product history を持たない**」。

### ports（論理contract）

```ts
interface ModelRegistryPort { getManifest(model): Promise<ModelPackageManifest>; }

interface SimulationRuntimePort {
  openSession(cmd: OpenSessionCommand): Promise<{ sessionId: string }>;
  send(cmd: RuntimeCommandEnvelope): Promise<RuntimeCommandAck>;
  openEventChannel(sessionId): Promise<ChannelRef>;
  openSignalChannel(sessionId): Promise<ChannelRef>; // 高頻度波形はdomain eventに流さない
  createSnapshot(sessionId, scenarioId): Promise<ArtifactRef>;
  closeSession(sessionId): Promise<void>;
}

interface AssessmentPort {
  submit(req: AssessmentRequest): Promise<{ jobRef: string }>;
  getReport(jobRef): Promise<AssessmentReport>; // immutable input → immutable report
}

interface ArtifactIndexPort {
  allocate(kind: ArtifactKind, meta: ArtifactMeta): Promise<ArtifactWriteRef>;
  commit(writeRef: ArtifactWriteRef, integrity: ContentIntegrity): Promise<ArtifactRef>;
  resolve(ref: ArtifactRef): Promise<ArtifactReadRef>;
}

interface ArtifactBlobPort {
  write(ref: ArtifactWriteRef, source: ByteStream): Promise<void>;
  read(ref: ArtifactReadRef): Promise<ByteStream>;
}

// target architecture上のpost-v1 extension例。
// v1の@circleheart/contractsにはまだexportしない
interface FittingPort {
  submit(req: FittingRequest): Promise<{ jobRef: string }>;
  getResult(jobRef): Promise<FittingResult>;
}
```

上記は責務を示す擬似interfaceであり、wire formatそのものではない。`ByteStream`やUI側の`AsyncIterable` / hook / controllerはadapter-localな便宜で、共有domain contractではない。React objectをPortにしない。

### contract 型の規律

- control planeを越える型はplain serializableにする。binary payloadをcommand、domain event、MCP JSONへ入れない。
- engine内部状態は`SnapshotEnvelope`（versioned opaque payload）として不透明化し、ArtifactBlobPortのdata planeで運ぶ。presentationは解釈しない。
- high-frequency signalは専用channelで流し、domain event logやrevision logには積まない。
- live signal channelはbranch / generation / presentation revision / stream epochにbindする。suspend / resumeは同じepochを継続し、target変更またはpromote後のtraceは新epochに分離する。
- MCP / external APIには原則としてartifact refと明示的なderived/export operationだけを公開する。SnapshotEnvelopeのbyte列や内部signal channelを直接公開しない。
- catalog を値（manifest）で渡す → presentation は `if (coronary)` を書かず、catalog にあるかをデータとして描画。
- deterministic input hashにはcontract version、model/runtime/solver/stateCodec version、parameter、initial snapshot、protocolを含める。時刻・actor・UI stateは数値再現性hashから除外する。
- **seam（portの線）は今引く。距離（in-proc → worker → server）と厚み（codec registry / fitting / UQ）は必要になった時に足す。**

### 疎結合構造

```
Reader / Study Lab / Document Editor
                 │
                 ▼
        CircleHeart Studio Application
          (Commands / Queries / ViewModels)
                 │
        @circleheart/contracts
      control refs │ data refs/channels
   ┌─────────┬─────┴─────┬──────────┬──────────┐
   ▼         ▼           ▼          ▼          ▼
ModelRegistry Simulation Assessment Artifact  Fitting
   Port       Runtime    Port       Index/Blob  Port
              Port                              (post-v1)
   └──── CircleHeart Model Platform ─┘  │         │
                                  Studio infra   Fitting service
```

---

## 14. ユーザー別 導線

### beginner（例: AS を学ぶ）
学ぶ → 弁膜症path → 記事「ASで圧較差が生じる理由」→ settled snapshotの1 pointを即時表示 → inlineでAS severityだけ操作（1×でtraceが伸び、圧較差の過渡が見える）→「詳しく操作」でPeek（PV loop + SV）→ 解説 →（任意）quiz。最初のcycleが閉じるまではPV loopを未完成として描き、window metricは`collecting`と示す。raw param / solver / graph追加はcapability上限で出ない。同じCellPlacementをfullscreenまで開け、別画面へ引っ越したように見せない。

### 臨床家（使い捨て。例: RV failure + PEEP vs Norepi）
症例 →「触ってみる」→ standalone scratchが即fullscreen → PEEP / Norepi branch → RV PV loop・RVP・PAP・CVP・COを比較 → parameter diff + limitations → 完結。開始時にDocumentやCellPlacementを裏で作らない。残す場合は（a）Experimentとして保存するとProject + durable ExperimentDraftを作る、（b）figureを書き出す（SVG/PNG + caption + methods）、（c）Documentへ追加するとDocumentDraft + CellPlacementを作る。clinical knobを前面、raw parameterはAdvancedに置く。

### 研究者
Projects → new project → model/version選択 → catalog取得 → Study Labでscenario + Working Set → parameter変更ごとに自動settle → steady candidateを確認してpin → RunArtifact → 必要ならAssessment（morphology / external comparison）→ run表（exact値・input hash・AssessmentReport・CSV）→ Experiment / figure / data export。v1はactive / pinned単一RunのSVG/PNG + methodsとCSV exportまで。sweep / batch / Parquet、general-purpose MCP write、fittingはpost-v1。

### author（公式コンテンツ）
Official Project → model/version選択 → 学習目標登録 → Study LabでNormal/HFrEF → 自動strict settle → candidateを採用してRunArtifact化 → required Assessment → CertifiedSeed → Presentation Compose（In-flow/Peek、graph selection、control binding、time alignmentをexplicit化）→ ExperimentRevision → Documentへ配置 → beginner/clinical preview → Publish Review（CertificationPolicy + validation profile参照）→ Published revision。Compose操作そのものがV&Vを起動するのではなく、publishが対象snapshotに紐づくrequired reportの有効性を検査する。engine更新後も公開物を自動差替えしない。

### patient fitting（post-v1）

private patient project → ObservedDatasetをPHI storeへ登録 → Fitting job → residual / held-out / identifiability / UQを含むFittingResultを人がレビュー → 明示的にParameterSetへadopt → 通常の自動settle → Assessment → 必要ならCertifiedSeed。FittingResultをそのままpresetやcertified resultへ昇格させない。

---

## 15. multi-scenario の追加考慮

- **brief materialization = Lab 相対の参照を全部 explicit に解決する工程**（active scenario → explicit、現在選択 → pin）。publish が ref を revision に解決するのと同じ構造（brief 時解決 : Lab = publish 時解決 : Document）。
- **explicit control binding**: Reader には active scenario 概念が無いため、brief 時に binding を freeze。author は「HFrEF のみ / 両方を同じ絶対値 / 両方を同じ割合 / scenario 別 slider」を選ぶ。
  ```ts
  ExplicitControlBinding = {
    controlId,
    targets: ScenarioId[],
    application: "absolute"|"delta"|"relative"
  }
  ```
  （単一モデルのため cross-model の mappingRef は不要）
- **graph overlay の時間軸 alignment**: Normal HR60 と HFrEF HR90 を重ねる時、`SeriesAlignment = absolute-time | beat-phase | event`。waveform/flow/energy で重要（PV loop は通常不要）。brief authoring で明示 or model preset が既定。

---

## 16. current cutover と将来のmodel-version upgrade

### current product → 新Studio

これはuser 0・公開前に行う意図的なgreenfield cutoverである。したがって、現行Studioの永続schemaに対する次はv1要件にしない。

- backward compatibility reader
- dual write / 段階的traffic移行
- 既存user data migration / rollback
- 汎用`MigrationPort` / `MigrationAdapter`

数理model、solver、runtime部品、catalog生成、port / artifact / V&Vの有用な実装は再利用する。一方、現在のofficial case / article / presetはmodel完成後に新schemaと新certification policyで再authoringする。現行dataと代表caseは、新Studioの数値同等性・表示・学習内容を確認するread-only regression fixtureとして残せるが、production compatibility contractにはしない。fixtureの機械importが手作業より安い場合だけ局所scriptを作り、product architectureへ恒久的なmigration abstractionを持ち込まない。

### 将来の公開済みcontent

- Published Document / Experimentはmodel/runtime/solver/stateCodec versionをpinし、その実行可能packageをretention policyに従って保持する。公開物を新versionへ自動migrationしない。
- 新versionへ更新する場合は、inputとpresentation referenceについて`mapped / dropped / unresolved / warnings / requiresResettle / requiresAssessment`を示すupgrade planを作り、確認後に**新Draft**を生成する。
- 新modelで再settle → required Assessment → 新CertifiedSeed → 新revisionとしてpublishする。旧revisionは不変。
- settled SnapshotEnvelopeのstate vectorは原則移植しない。科学的・数値的に保証されたmodel固有upgrade toolが将来必要になった時だけ個別に設計する。

この将来upgrade workflowは重要だが、現在のcutoverのためのgeneric MigrationPortをv1で先回りして作る理由にはしない。

---

## 17. v1 スコープ

今回の変更は機能追加ではなく、Model PlatformとStudioの責務を切り直す大規模再設計である。legacyとの段階移行は行わないが、実装と検証はvertical sliceで進める。「段階的に実装する」と「旧構造を段階的に移行・共存させる」は別である。

### v1 で本物として接続するもの

1. `@circleheart/contracts`とModel Platform adapter境界、1つの完成model package。
2. SnapshotEnvelope / RunArtifact / AssessmentReport / CertifiedSeed / content-addressed Artifact Store。
3. standalone scratch → durable ExperimentDraft、multi-scenario Study Lab、manual ParameterSet preset。
4. parameter変更ごとの前景live + 背景strict steady job、generation discard、1-point start、手動candidate採用。
5. profile-scoped Assessment / CertificationPolicy / publish gate。
6. Presentation Compose → ReaderのIn-flow / Peek / Fullscreen。
7. DocumentDraft / CellPlacement / immutable revision / atomic Publish。
8. active / pinned単一RunのSVG/PNG + caption / methods、およびCSV export。

導線としてはReader → Inline Experiment → Peek → standalone scratch / Study Lab → Presentation Compose → Document Editor → Publishをstubなしで1本通す。

### 実装slice（legacy migration phaseではない）

0. 規範別紙の確定 + runtime blocking spike。
1. contracts / model package / runtime / artifactの最小縦切り。
2. standalone scratch + Study Lab + Experiment versioning。
3. Assessment + Certification + author seed。
4. Compose + Readerの3 extent。
5. Document + atomic Publish + official contentの再authoring。

各sliceは前sliceのcontract testと数値regressionを維持する。旧Studioへのdual writeや旧schema adapterは作らない。

### v1 で省く / vocabulary・extension pointのみ

AI command bar / authoring wizard / community publishing / free canvas / sweep・batch・Parquet / `PhysiologicInterventionProtocol`のauthoring・execution・certification / target-driven fitting / patient fitting / general-purpose MCP write / MigrationAdapter / cross-model ComparisonAdapter /汎用SnapshotEnvelope codec registry / causation-correlation tracing / UQ・identifiability / Embed SDK・EvidenceBundle。manual preset（名前付きParameterSet）はv1に含めるが、optimizerやObservedDatasetは含めない。

### 最初のblocking spike

**「任意のpinned RunからN本を同時に温間再開し、settled snapshotの1 pointから1×で重ね描画しつつ、parameter変更ごとにstrict steady jobを自動実行できるか」**を全presentation contextへ広げる前に確認する。これは唯一の設計リスクではないが、失敗すれば中心UXが成立しないblocking riskである。

headless側では、exact V4 restore、同revision/timeの1-point projection、N-branch intent、live/strict Worker分離、generation discard、signal channel suspend/resume、P1 candidate admission、明示promotionのcontractとadapterが入った。さらに既存product Workbenchへのbridgeで、settled snapshotの1 pointからの表示、parameter commitごとの自動live+strict、固定1× live、pause/resume、candidateの明示promotionとpinを実browser surfaceへ接続した。parameter変更時の波形はincoming windowが満ちるまで直前generationを保持し、PV loopは設定可能な最大6世代のparameter-generation履歴をbeat履歴とは別にfade表示する。いずれも旧generationを保持中のdomain計算へ含める。

Guyton/Starlingはunavailable placeholderではなく、scenarioごとのpersistent MainWire analysis Workerへ接続した。表示paneのdemandをlatest exact settled sourceへbindし、短命なexact V4 restore session上でbidirectional continuation sweepを走らせる。source/detail変更はlatest-onlyにserializeし、superseded job/sessionをcancel・disposeして旧結果のpublishを拒否する一方、parent Workerはscenario lifecycle中維持する。left/right demandは必要detailへcoalesceし、新結果待ちまたはerror時は最後のusable presentationを保持する。V&V reportとadvanced PV relation/load-seriesは引き続き旧経路へfallbackせず、UIで明示的にunavailableとする。

ただし現在のbridgeはscenarioごとに独立したsessionを作るため、targetの
1 aggregate session = N branchesとatomic multi-scenario intentを実browserで
証明していない。canonical Document Editor、Workbench Briefing compose・
capture、同一graph rendererを使うReader Previewまではsession-onlyで
接続したが、最終のpublished Reader / aggregate Study Lab / durable
Document applicationではなく、Workbench shellと旧presentation型を一部
再利用したtransition sliceである。未完なのはaggregate sessionへの統合、
実browser上の性能budget検証、viewport scheduler、target Reset、
multi-placement / per-extent presentation、durable project、certification /
publicationへの接続であり、blocking spike全体を完了扱いにはしない。

受け入れ条件:

1. SnapshotEnvelopeのcanonical phaseと補助runtime stateから、最初の1 pointを即時に出し、波形・PV loop・window metricを契約どおり成長させられる。
2. slider変更でcoreをresetせず連続積分し、HR / phaseに不自然なjumpを生じさせない。
3. 各変更でgenerationを進め、前景liveとstrict steady jobを自動開始し、古いjob結果を確実に破棄する。
4. strict steady完了で表示中sessionを自動差替えず、明示的なcandidate採用が正しく働く。Resetは別途実装・検証する。
5. N本同時表示とoffscreen suspend / resumeで、数値結果とphase continuityが変わらない。
6. target desktop / mobile機種、N、表示graph、sampling、warm-upを固定したbenchmarkで、p95 frame time、dropped-frame率、input-to-first-point、strict-job完了時間、peak memoryが事前に定めた数値budgetを満たす。
7. 同一input / version / snapshot / protocolから、許容誤差内で同一のsteady resultとinput hash associationを得る。

benchmarkの対象機種と数値budgetはspike実施前に規範別紙へ記載する。「frame落ちなし」のような観測不能な条件にはしない。

注意: runtimeは「変更ゼロ」ではない。数理engineは資産だが、(a) steady完了時auto-promoteをStudio境界で採用しない、(b) arbitrary pinned Runからのwarm-restart wrapper、(c) generation管理付き自動strict job、(d) N本同時 + branch suspend/resumeが必要である。(a)–(d)のheadless境界は実装済みだが、offscreen UI schedulerと性能qualificationは未完。

---

## 18. 非交渉の決定事項（ADR 候補）

1. CircleHeart Model Platform（数理・runtime・assessment）とCircleHeart Studio（product/application/presentation）をsoftware project境界として分け、共有するのはversioned contractとartifactである。物理repo分割は依存境界が安定してから判断する。
2. ユーザーが扱うcontent rootはExperimentとDocument。domain identityはExperiment（Draft→Revision）/ CellPlacement / SimulationSessionの3つに分ける。
3. Reader / Study Lab / Document Editorはpresentation contextであり、別domain ownerや別engineではない。Experiment ComposerはStudy Lab上の一時Presentation Compose Layer。
4. standalone scratchはSimulationSession + ephemeral ExperimentDraftで開始する。保存時にdurable ExperimentDraft、Document追加時にDocumentDraft + CellPlacementを作る。n=1 Documentをscratchの内部表現にしない。
5. graphはspatial（author配置・content保存）、controller / metricは主にinspector。Catalog → Working Set → Briefは足し算。
6. extentはIn-flow / Peek / Fullscreen、capabilityはRead / Interact / Composeとして直交させる。FullscreenはCompose権限を意味しない。
7. 前景は1×生理時間。settled snapshotのcanonical phaseにある1 pointから描画を始め、traceを成長させる。canonical last-beat sampleは保存しない。
8. parameter変更ごとに前景liveと背景strict steady jobを自動開始する。generation不一致の結果は内部で破棄し、`stale` / `available`をユーザー向け永続状態にしない。steady candidateへ自動ジャンプしない。
9. RunArtifact / AssessmentReport / CertifiedSeedを分ける。Certification用Assessmentはsnapshot + assessor + validation profileに紐づき、Compose操作には紐づかない。研究用Assessmentはimmutable artifact setもsubjectにできる。required / advisory gateはCertificationPolicyで決める。
10. Readerは通常、公開済みCertifiedSeedから再生し、重い完全Assessmentを毎回走らせない。必要なruntime / solver / stateCodec packageは公開revisionとともに実行可能性を維持する。
11. 波形・window metric・thumbnailはderivedで、canonical contentにはしない。canonicalなのはsettled SnapshotEnvelope、input、version、protocol、artifact associationである。
12. 1 Experiment = 1 model+version。cross-model comparison / mapping adapterはv1で作らない。
13. control transitionはRuntimeUpdatePolicy（操作感・数値更新）とPhysiologicInterventionProtocol（科学的に意味のある経路）に分ける。v1は前者を実装し、後者は型・hash extension pointのみ。
14. model packageはcatalog / state codec / assessor / gate definition / non-bypassable MinimumCertificationProfileを所有する。Studio/contentはcase固有CertificationPolicy / expected finding / publication policyを所有するが、minimum gateを削れない。official publishは承認済みPolicyRevisionのみ。
15. presetは名前付きimmutable ParameterSetとしてv1に含める。FittingResultはParameterSetではなく、明示的adopt → settle → Assessment → Certificationを通す。v1はFitting contractを固定せず、target-driven fittingとcontract v1をv1.5、patient fittingをv2とする。
16. patient fittingのObservedDatasetとSensitiveFittingLineageは分離PHI storeに置く。publish / embed / general MCPから到達不能にし、parameterも自動的にanonymousとは扱わない。v2前にconsent / retention / deletion・revocation / backup / derived lineage policyを固定する。
17. control planeはserializable command / event / ref、data planeはbinary / streamに分ける。Presentationにengine内部型を漏らさず、MCPにSnapshotEnvelope byte列や内部signal channelを出さない。
18. versioningはcommand log（diff / undo / AI / provenance）+ materialized snapshot（再現性 / pin）の二層。engineにproduct event-sourcingを持ち込まず、undoはcompensating command。
19. publishはimmutable参照を持つPublicationManifestの原子的commitとし、required assessmentの整合・楽観lock・idempotencyを検査する。
20. 現行Studioはuser 0 / pre-releaseとしてgreenfield cutoverし、legacy dual write・汎用MigrationAdapter・user data migrationをv1要件にしない。将来の公開revisionは旧versionをpinし、更新は新Draft → resettle → reassess → republishで行う。
21. Article authoringを旧Workbenchのnote paneに残さず、Documentのtext blockへ統合する。

---

## 19. 実装と並行して閉じる規範別紙 / 残るopen questions

本文はtarget architectureと責務境界を決める。runtime foundationは
[STUDIO-RUNTIME-001](specs/STUDIO-RUNTIME-001-foundation-vertical-slice.md)、
product Workbench bridgeは
[STUDIO-RUNTIME-002](specs/STUDIO-RUNTIME-002-product-workbench-bridge.md)
、session-onlyのDocument Editor / Briefing capture / Author → Reader Previewは
[STUDIO-CONTENT-001](specs/STUDIO-CONTENT-001-reader-preview-vertical-slice.md)
として実装境界を固定した。ただし次の規範別紙を確定し、contract testへ
落とすまではStudio全体の「実装仕様が完全」とは扱わない。

### required companion specifications

1. **Domain / artifact schema & invariants**
   Project / ExperimentDraft / ExperimentRevision / DocumentDraft / DocumentRevision / CellPlacement / SimulationSession / ParameterSet / RunArtifact / SnapshotEnvelope / AssessmentReport / MinimumCertificationProfile / CertificationPolicy / CertifiedSeed / PublicationManifest / ArtifactRefのcanonical schema、identity、lifecycle、ACL、hash対象、参照整合、削除・retention。
2. **Runtime protocol & state machine**
   multi-scenario open / live update / generation increment / strict job / discard / candidate promotion / reset / suspend-resume / failure-retryのsequenceと状態遷移。1-point start、canonical phase、metricの`collecting`契約を含む。
3. **Assessment / Certification / Publish**
   assessor identity、validation profile、required / advisory gate、invalidation rule、CertificationPolicy、atomic publish、idempotency、未参照blob回収。
4. **Contract / transport / reproducibility**
   control-plane envelope、data-plane channel / artifact protocol、worker / server adapter、async job lifecycle（submit / status / progress / cancel / result / retry / idempotency）、deterministic input hash、数値許容誤差、model/runtime/solver/stateCodec package retention。
5. **Document content model**
   Document AST / block schema、CellPlacement埋め込み、editor（例: BlockNote）adapter境界、asset / citation / caption / methods / i18n、copy / export / link integrity。
6. **Verification plan**
   runtime spikeの対象機種と数値budget、数値regression fixture、failure injection、accessibility、offline / artifact-missing時の挙動、各vertical sliceのacceptance criteria。

### product / post-v1 open questions

- Library / 発見導線（公開Experimentをどう検索・再利用・Documentへ配置するか）。
- catalog / renderer retentionの実装方式（versioned bundleをそのまま保持する期間、互換adapterへ移す条件、storage / security patch policy）。旧Revisionが必要なmanifest / display metadata / renderer contractをpinする原則は決定済み。
- 外部interactive配信（Embed SDK / EvidenceBundleのどちらを、どのtrust boundaryで提供するか）。
- v1.5のFittingRequest / FittingResult / FittingPort contract、target-driven / patient fittingのmethod選択、clinical intended use、UQ / identifiability / held-outの最低基準。
- v2 patient fitting着手前のPHI DataLifecyclePolicy（consent / purpose / retention / legal hold / deletion・revocation / backup / derived lineage / export-safe provenance）。
- model packageを物理的に別repoへ分ける時点とrelease orchestration。論理依存境界は本書で決定済み。

---

## 20. 一文サマリー

CircleHeartは、versioned contractで分離したModel Platformの数理資産をStudioが利用し、ExperimentとDocumentをcontent root、Experiment / CellPlacement / SimulationSessionを別identityとして扱う。standalone scratchはDocumentなしで始まり、保存・配置時にだけdurable objectを作る。Catalog → Working Set → Briefで同じ内容をIn-flow / Peek / Fullscreenへ投影し、parameter変更ごとに前景liveと背景strict steadyを自動実行するが、古いgenerationは破棄しcandidateへ自動ジャンプしない。表示はsettled snapshotの1 pointから成長させ、canonical last-beatは保存しない。Run / Assessment / CertifiedSeedを分離し、snapshot/profile scopedなrequired gateを通ったimmutable artifactだけをatomic publishする。現行Studioはlegacy migrationなしでgreenfield cutoverし、manual ParameterSet presetをv1、fittingを安全・PHI境界を伴う独立post-v1 subsystemとして進める。
