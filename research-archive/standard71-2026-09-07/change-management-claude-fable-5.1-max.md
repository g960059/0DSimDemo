<!-- Independent answer; workstation path prefixes normalized for archival portability.
Reviewed prior uncommitted admission code, not the later implementation change.
Local Git links below identify the reviewed worktree paths; they are not runtime citations. -->
調査は完了しました。以下、実証した事実、独自の推論、未確認事項を分けて述べます。

## 実証した事実（コードと履歴から）

- **71→72の差分は保存契約のみ。** 72の物理identityは71のfixture・material・calcium・血管構成をそのまま参照し、追加されたのは `numericalContinuation` 1項目だけです。`engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1.ts:40-60` と研究worktreeの `MainWireIntegratedModelStandard71CheckpointV1.ts:35-54` を並べると、差は predictor 履歴の有無だけです。72 Session も71 fixtureを生成して使います（`engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1.ts:120`）。
- **70→71は物理変更。** 70のlaunch baselineはTBV 5050、LVFW活性張力scale 1.32。71はTBV 4935、Tref絶対較正、CaT50Ref/beta1変更、systemic compliance 0.65、Ao–SA inertance 0（`engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1.ts:23-69`）。manifest差分でも equations 側4項目、checkpointCodec 側4項目が変わっています。
- **71は一度も登録・公開されていない。** 71のmodelIDは研究archive commit e7c5e76a で初めて現れ、production worktreeには存在しません。71への参照はPR614の凍結文書（`packages/standard71-document-v1.index.json`、releaseStatus は local-candidate-not-registered）とe2e specだけです。
- **70も同じ「履歴欠落」を持っている。** lean tierでは基底Sessionが全Standard共通でcubic predictorを使います（`engine/vnext/MainWireIntegratedTypedAuthoritySessionV1.ts:1054-1058, 1134-1137`）。70のcheckpointにはpredictorが含まれず、70 Sessionにもpredictor関連の記述はありません。つまり71で「発見」された restore後の非bit一致は、現在公開中の70にも同様に存在する性質です。70のartifact gateは生成直後にcaptureして1 stepだけ比較するため、これを検出できません（`tools/registry/verifyMainWireIntegratedStudioAlgebraicProximalRootsV1.ts:803-820`）。
- **72の科学的admissionは構成hashに束縛されている。** `Standard72RegistryAdmissionV1.ts` は constructionSha256 と v4 eligibility のhashを固定し、71研究の生理評価を再実行せずに再利用しています。つまり「物理は構成hash、IDは別」という二層化は既に事実上行われています。
- **モデルごとの専用gateが積み上がっている。** 65/66/67/68/69/70/72 の7本のartifact（各2.2–2.5MB、合計約16MB）と、それぞれのCI jobがverify.ymlに残っています。AGENTS.mdは「release前は旧identityを退役させよ」と書いていますが、実態は退役されていません。
- **merge blockerの原因は共有hostの肥大。** `MainWireIntegratedStudioSelectedAorticOutflowExactModelV1.ts` が66〜72全variantのunion型hostで、72追加により70のartifact byteが変わり、70の決定的build gateが落ちています。72自体の数値は変わっていません。
- **未commit差分は admission の意味を弱めている。** staged版は「restore→launchまで進めてsealed launch checkpointと一致」を要求していましたが、作業中の変更は同一runtime内の twin 同士の一致に置き換えています（`checkpointReproductionScope` で明示）。cross-runtime浮動小数点差への現実的な対応ですが、「このruntimeがsealed launchを再現する」という主張は落ちます。
- **71凍結文書は72どころか71 Sessionにも解決しない。** 文書catalogは modelId+surfaceReleaseId で照合しますが、文書は workbench-v2 をpinし、72は measured-diastolic-workbench-v1 を継承しています。番号を戻しても文書は自動では結び付きません。

## 論点ごとの見解（独自の推論）

**1. 71→72は「不要」でした。条件付きでもありません。**
理由は3つ。71は未登録で、保護すべき保存データ・公開checkpointがゼロ。72の変更は構成不変で、生理評価は再利用された（＝mintが守るべき科学的主張は変わっていない）。そして同じ性質を持つ70が新IDなしで公開されている以上、規約は一貫して適用されていません。最も強い反対論は「DESIGN-007はcheckpoint continuationの変更に新modelIDを要求し、旧形式を暗黙に新契約へ格上げしてはいけない」という点です。これは正しい原則ですが、対象は**登録済み**IDです。誰も参照していない候補IDを守っても得るものはありません。

**2. modelIDが識別すべきもの。** 二層にするのが最小です。
- 構成ID（constructionSha256 相当）：方程式、固定定数、fixture/material/calcium profile、solver toleranceなど「生理的に意味を持つ数理」。科学的評価・外部レビュー・文書はここに束縛する。
- modelID：構成ID＋state layout＋checkpoint形式＋continuation semantics。保存content・registry・artifactはここに束縛する。
baseline/preset は fixture＋launch metadata（既にそう）。artifact は modelID下のrevision（既にそう）。Surface/analysis は別系列（既にそう）。文書は構成IDをpinし、登録後に modelID を追記する。

**3. 固定する時点。** 「IDは登録時に不変になる」を唯一のルールにする。研究中・ローカル・devでは candidate 名で自由に作り直し、番号は registry へ publish する瞬間に振る。保存実験や記事から参照された時点でその modelID は不変。release前の今は、外部参照ゼロなので登録＝固定で十分です。

**4. 変更種別と必要な手続き。**

| 変更 | 新mint | 生理gate | 外部レビュー | 文書 |
|---|---|---|---|---|
| 方程式・定数・tolerance・fixture構成 | 必要 | 再実行 | 1/2 | 新規凍結 |
| checkpoint形式・continuation（構成不変） | 登録済みなら必要、未登録なら不要 | 構成hash一致で再利用 | 不要（コードレビューで可） | 数値注記の追記のみ |
| artifact refactor（byte一致） | 不要 | 再利用 | 不要 | 不要 |
| Surface・analysis method | 不要 | 再利用 | 不要 | Surface側 |
| baseline/preset選択 | 不要 | preset固有gate | 1/2（選択の妥当性） | preset文書 |

再利用してはいけないもの：構成hashが変わった後の生理evidence、solverやcheckpointが変わった後のcontinuation evidence、同一engineの一致をcross-engineの一致として語ること。

**5. 今回のコストの内訳。** 新IDに起因したのは、72用のID定数・artifact・client.json・lock・CI job・専用admission script（240行）・3本の evidence JSON・「71を再ラベルしない」ための説明文と3回の外部レビュー往復です。IDに関係なく必要だったのは、predictor履歴を持つcheckpoint実装、continuation試験、artifact parity、browser worker確認、そして71構成そのものの registry admission です。構造的な問題は番号ではなく、**モデルごとに専用の verify script と CI job を書く運用**と、**退役モデルを共有hostに残す設計**です。この2つが毎回のmintコストと、今回のような無関係な gate 破壊を生んでいます。

**6. 71/72とPR613/614/615の扱い。** 番号を71に巻き戻すことは技術的に可能です（未登録、artifact再生成と再検証だけで生理再実行は不要）。ただし今からやる価値は低いと判断します。archiveは一貫して72で記録済みで、71文書は surface 不一致のため番号を戻しても結び付かず、巻き戻しのコストは新しい利益を生みません。推奨は次の通り。
- PR613：DO NOT MERGE archive のまま。
- PR614：generic reader として merge。文書catalogの照合を modelId+surface から構成hash（または明示リスト）に変え、71文書を「登録前候補の凍結文書」として72 Sessionにも表示できるようにする。
- PR615：72 admission は完成させるが、専用scriptの増設は今回で最後にする。merge blockerは70 artifactを再admissionするのではなく、AGENTS.mdの通り65〜69のartifact・lock・CI jobを削除し、72活性化後に70も退役させることで解消する。registryが不変byteを持つので、repo内コピーは歴史的pinに不要です。未commitの twin 比較への変更は妥当ですが、sealed launch との一致が sealed binding 側にしかないことを lock の文言どおり明示したまま採用してください。

**7. 1人＋AIで維持できる方針案。**
- ID二層（構成hash／modelID）。evidenceは構成hash、contentはmodelIDに束縛。
- 番号は登録時にのみ振る。mainには候補は常に1つ。
- 生成的な registry gate を1本にし、引数で対象モデルを指定。CIは「活性モデル」と「候補」の2 jobだけ。
- 外部レビュー1/2は構成変更とgate・policy変更に限定。保存形式・refactor・Surfaceは AI コードレビューと主担当採択で済ませる。
- 文書は登録済みモデルごとに凍結。候補段階は構成hash付きdraft。
- 避けるべき過剰設計：モデル別verify script、union型hostの成長、退役artifactのrepo保持、非物理変更への多段レビュー、cross-runtimeのhash完全一致要求。

## 未確認事項

- Supabase registry の実際の行（70が stable か、71/72の行が存在しないか）はDBを見ていないため未確認です。
- 保存済みExperimentが70をpinしているかは未確認です。あれば70の退役は「活性化不可・歴史的pin保持」の扱いになります。
- 71凍結文書本文（約1万行）は読んでおらず、checkpoint形式に言及していないことは未確認です。
- 各レビュー記録のテスト合格数は再実行していません。70の非bit一致も再現実行はせず、コード構造からの判断です。

**推奨方針（要約）：** 72は残し、番号は戻さない。今後は「IDは登録時に不変、evidenceは構成hashに束縛」を規約にし、DESIGN-006/007の「checkpoint変更＝新modelID」を「登録済みIDに限る」と改訂する。PR615では72専用gateを完成させつつ、65〜70の artifact と CI job を退役させて blocker を解消し、次回以降は汎用gate1本に統合する。
