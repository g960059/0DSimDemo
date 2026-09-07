<!-- Independent answer; workstation path prefixes normalized for archival portability.
Reviewed prior uncommitted admission code, not the later implementation change.
Local Git links below identify the reviewed worktree paths; they are not runtime citations. -->
私の判定は「条件付き」です。現行のexact model契約を守るなら71→72は必要です。ただし、未登録の研究候補を変更するたびに、新しい正式モデルをmintして科学的評価を一式やり直す必要はありません。今回の負担は、この二つを結び付けすぎた部分が大きいと考えます。

今からの扱いは、72を昇格候補として残し、71は研究記録に限定することを推します。理由は「実装済みだから」ではなく、既に凍結文書が指す71と、保存契約を修正した実行版を別名にしておく方が、来歴を説明しやすいからです。72への改名を理由に、生理評価や文書の内容を全面的に作り直すことには賛成しません。

確認した事実は次のとおりです。

- 71と72のSessionを直接比較しました。72は同じ`createMainWireIntegratedModelStandard71FixtureV1`と基準入力を使っています。両worktreeのFixtureファイルにも差分はありません。主な変更はpredictor履歴の保存・復元、その時計・状態整合性の検証、履歴を落とす旧APIの禁止です。72 Session (`Standard72 worktree: engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1.ts:65`)
- 71のcheckpointはpredictor履歴を保存しません。72はこれを必須の継続状態として含めます。したがって、方程式が同じでも保存後の実行契約は異なります。72 checkpoint (`Standard72 worktree: engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1.ts:40`)
- 71の凍結文書には`local-candidate-not-registered`と明記されています。72のproduction抽出には71の実行モデルは入りません。72自身も、コード・保存報告上は登録前の候補です。71文書index (`saved-document reader worktree: studio/presentation/modelDocumentation/packages/standard71-document-v1.index.json:3`)
- Studioの保存内容は`modelId`とSurfaceを固定し、artifact revisionやcheckpoint codecを独立には固定しません。同じmodel IDの意味を変更すると、既存の保存内容が別の実行契約へ解決され得る設計です。保存契約 (`Standard72 worktree: studio/contracts/v2/content.ts:35`)
- 72用admissionの未commit変更を含めても、Studioの既定モデル、launch baseline、fitting referenceは70を指しています。72の登録用ファイルができたことと、利用経路の移行完了は別です。既定モデル (`Standard72 worktree: studio/composition/StudioDefaultCompositionV2.ts:53`)、fitting reference (`Standard72 worktree: analysis/registry/MainWireFittingReferenceRegistryV1.ts:31`)

71→72を必要とする最も強い論拠は、既存の保存内容がmodel IDだけで実行契約を選ぶことです。登録済み71を同じIDのまま置き換え、「旧保存形式は履歴なし、新形式は履歴あり」とすると、同じIDが複数の継続保証を持ちます。それを適切に管理するには、別のruntime/checkpoint版を永続化する設計が必要です。今の規模では、新しいexact IDの方が単純です。

反対に、mint不要説の最も強い論拠は、71が未登録候補だったことです。未固定の候補を修正し、最終形を一度だけ登録すれば済みました。研究時点をcommit・artifact・入力のhashで識別していれば、保存方式の不備を直すだけで、二つの正式モデルを作る必然性はありません。今回「72」という文字列を宣言したことと、二回の正式公開・認定を行ったことも同一ではありません。

model IDは、方程式だけでなく「保存した実験をどう実行するか」を識別するものとして維持する案が最小です。「生理モデル版」「solver版」「checkpoint版」を別々の永続的release軸として追加することは、現段階では勧めません。

| 対象 | 識別・変更の扱い |
|---|---|
| 方程式、状態構成、固定された構成定数 | 固定後に変えるなら新しいexact model ID |
| 積分、solver、イベント順序、継続に必要なcheckpoint状態 | 固定後に実行契約が変わるなら新しいexact model ID |
| baseline・疾患presetの許可済み入力値 | 入力・baseline・captureの版／hash。model IDは維持 |
| artifactの整理・最適化 | 実行契約とmanifestが同じで、必要な等価性を確認できればartifact revisionのみ |
| 派生解析・評価基準 | analysis method／policyと結果の版。通常model IDは維持 |
| 表示項目・解析の公開 | Surfaceの版。exact modelとは独立 |
| 数理説明・過去評価の保存 | document ID・内容hash・出典。数理モデルのmintとは独立 |

「固定された構成定数」と「入力値」の境界は明示すべきです。例えば今回71のLand/Ca校正値や根部構成の変更は、70の既存presetを変えただけではありません。一方、許可された抵抗・血液量・収縮性などのfitting結果は、毎回新しいモデルにする必要がありません。70には既に、model IDを変えずlaunch baselineを更新する実装と履歴があります。launch baseline (`Standard72 worktree: studio/registry/RegisteredModelLaunchBaselineV1.ts:146`)

固定する時点は、release前後という日付より「何を参照可能なものとして約束したか」で決めます。

研究中・使い捨てのローカル候補は、commitまたはartifact hash、実際の入力、初期化、数値設定、解析・評価方針を記録して進めます。候補名は変更可能です。説明を保存した場合も、そのdocumentと研究記録が固定されるのであり、以後の候補修正をすべて正式mintにする必要はありません。ただし、dirtyな作業の場合はHEADだけでは不十分で、実際に使った内容を識別できる必要があります。

保存実験や再実行可能な共有内容が、model IDを唯一の実行指定として使い始める時点では固定します。`dev`登録でも同じです。外部ユーザーがいなくても、本人の保存実験や記事の再現性は残ります。不要な試作品は明示的に廃止できますが、同じIDの意味を黙って変えることは避けます。

公開後も、現在の実装ソースに全世代を残す必要はありません。文書を読めること、結果の来歴を読めること、古い実験を再実行できることは、それぞれ保存対象が違います。支持する再実行範囲だけ、対応artifact・Surface・analysis等を保存すれば十分です。PR614の独立readerは、この方向に合っています。

検証は「新IDになったか」ではなく、変更で何が壊れ得るかから選ぶべきです。

- 今回のcheckpoint変更では、履歴が入った保存点での未中断Session対restore、複数拍・イベント境界、captureの非干渉、control／analysis fork、実際のWorker転送経路が重要です。これらは71の番号を維持しても必要でした。
- 方程式・solver・固定定数が変われば、数値検証と影響する生理・応答条件を再評価します。どこまで再評価するかは変化の範囲で決め、全条件の一律再実行にはしません。
- baselineやpresetを採択する場合は、model IDが同じでも、その入力でのsettlement・対象現象・数値的な安定性を確認します。探索中の毎候補に採択時と同じgateをかける必要はありません。
- analysisや評価基準だけが変わる場合、必要な原信号が保存されていれば再解析できます。新しい結果として保存し、過去の評価を新基準で上書きしません。

今回の生理評価は、物理構成、入力、観測定義、数値経路、評価基準が変わっていない範囲で再利用できます。ただし「同じ方程式だから」で十分とはしません。変更されたrestore経路を評価手順が使っていたか、旧結果と新実装の対応を確認する必要があります。既存のfine／reserve報告を新しい72実測として付け替えることもできません。「同一構成の既存評価を、この対応証拠に基づいて使用した」という記録でよいと考えます。

外部AIレビューは、ユーザー指定の1/2運用を、数理変更・基準変更と証拠再利用の判断に適用します。承認済みの判断が変わらない名前・hash・登録ファイルの機械的更新で、毎回新しい承認を取り直す必要はありません。新しい数理的論点や基準変更が生じたら、その差分を戻します。確認したAGENTSと主要設計文書には、mintの各工程ごとに承認票を集める規定はありません。AGENTS (`Standard72 worktree: AGENTS.md:8`)

今回のコストでは、次の三点を分けるべきです。

第一に、保存保証の不足を発見して直すこと、最終artifactが修正を含むこと、適切な数値試験を通すことは実質的な作業です。mintをやめても消えません。

第二に、世代ごとのSession・codec・gateのコピー、登録配線、文書の表題変更などは、ID方式と実装構造による費用です。今後はcurrent実装と小さなrelease定義を中心にし、過去版はGit／保存artifactへ退避する方がよいでしょう。共有部品の名前に71が残っていても、72にそろえるためだけの改名は不要です。

第三に、現在のCIは65〜70の登録検証を残したうえで72を追加しています。共有hostへ72分岐を追加すると旧artifactの再ビルド結果も変わるため、過去世代の再認定作業が発生します。これは72という番号そのものの問題ではありません。現役のソースから古い全artifactを毎回再構築する仕組みを縮小し、保持する既存artifactの整合性確認と、現役モデルの検証を分けるべきです。CI (`Standard72 worktree: .github/workflows/verify.yml:58`)

未commitの72用admissionには、証拠と最終artifactを結び付ける価値があります。一方、科学的評価の固定hashに、artifact・default fixture・Surface全体・analysisの固定hashが強く結合されています。そのまま世代ごとに複製すると、表示やbuildの変更でも科学的承認記録を更新する運用になりやすいです。科学的評価の再計算と、既存評価へのreleaseの結合は、同じコマンドで実行しても責任を分けるべきです。汎用gate言語や新しいregistryを作る必要はありません。72 admission (`Standard72 worktree: tools/registry/Standard72RegistryAdmissionV1.ts:39`)

また、unstaged変更の「二つのrestoreが一致する」という検査は、決定的なrestartの検査です。それ単独では未中断の継続との一致を証明しません。71も二つのrestore同士は一致する記録があります。72の強い保証は、別の未中断Session対restore試験に依存している、と区別しておく必要があります。

PRの扱いは次を推します。

- **PR613**：研究・来歴の保存先として維持し、まとめてproductionへmergeしない。必要な凍結文書と評価を残せれば、旧71実装を現役コードに保持する必要はありません。
- **PR614**：独立readerとして切り離して進める。過去文書の保存を、新しいモデルの登録条件に連動させない。
- **PR615**：72を候補として維持する。追加の全面的な生理再認定を番号変更だけで要求しない。Studio・fitting・文書の利用先が72を実際に扱えることと、旧70の扱いを具体的に完了させる。70をまだ利用する経路がある段階で、その依存まで一括削除しない。

71へ戻す案も技術的には可能です。未登録・未参照の実行候補として再定義し、凍結71文書との区別を整理すれば成立します。ただし、今回は名前を戻しても必要なcheckpoint検証やartifact結合は減らず、既存文書の71との説明が増えます。私は選びません。将来は、正式番号を付ける時点を遅らせて、この状況自体を減らします。

調査は3 worktreeのコード・対象履歴・保存報告・staged／unstaged差分と、PR metadataの読み取りに限りました。PR613／615はdraft、614は非draftのopen状態を確認しました。DB内の実際の登録、保存実験・記事からの参照数、現在のremote active bundleは未確認です。数値報告の値は記録として確認したもので、今回はsimulationやtestを再実行していません。変更管理方針の意見であり、PR615の実装完了・merge承認ではありません。

推奨方針を短くすると、次の五つです。

1. 研究候補は内容hashで追跡し、正式mintは利用契約を固定するときに行う。
2. 固定後の数値・継続契約の変更は新exact IDにする。
3. mintは全面的な生理再評価を意味しない。変わった責任だけ検証する。
4. baseline・解析・評価・文書はそれぞれ更新し、過去の記録を上書きしない。
5. 現役コードとCIは小さく保ち、過去の可読性・必要な再実行性は保存成果物で担保する。
