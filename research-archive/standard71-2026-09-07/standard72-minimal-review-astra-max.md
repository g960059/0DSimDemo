# Standard72 extraction and admission-boundary review

Reviewer: Codex6 Astra max, task `/root/checkpoint_contract_review`.
Read-only independent review,2026-09-08. The requests supplied scope, source
paths and measured facts without requiring a preferred decision. No Claude
review or two-reviewer agreement is claimed.

## Admission design review — verbatim

設計として **APPROVE**。72専用の baseline admission を設け、共通の artifact 検証へ接続する方針を支持します。ただし、現段階で登録・公開を承認するものではありません。

必須にすべき内容は次の4点です。

1. **採用済み scientific eligibility の全条件**  
   `Rest` 単独では不足です。同一構成の独立cold 2ms/1ms、適用条件、周期収束・保存則・単一Ca owner、τの観測品質と未解決形状hold、pressure-rate品質、4方向のreserve admissionを合成してください。[既存の合成箇所](/Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo/tools/scientific/assessMainWireProspectiveBaselineV1.ts:62)を純粋な判定関数へ抽出する程度で十分です。72の対象は承認済みのHR70・TBV4935・BSA1.9に限定します。

2. **72で実際に採用する判定の根拠**  
   net CI、平均RAP/PAP、CMR両stratum、Ao負荷guard、native LV end-filling guardを、承認済みの意味・不等号・適用条件のまま固定します。Ao値をHerbert由来正常帯、native圧を臨床LVEDPそのものとはしません。数値・gradient・ringing・reserveのengineering条件も保持します。

3. **研究結果から実際の72 releaseへの結び付け**  
   元のv4 admission、coarse/fine結果、72 fresh bindingを不変の証拠として扱い、新しいproduction admission reportからhashで参照します。model ID、物理構成、default fixture、周期境界／launch checkpoint、policy実装、最終artifact、継承Surfaceとpinned analysisが一致することを検証してください。旧結果の再ラベルや、fine/reserveを「72で再実行した」とする記述は不可です。

4. **公開前の必須検証**  
   `status: passed`やファイル存在だけでは通さず、判定の再計算または内容を固定した検証済み証拠と、上記の結び付けをfail-closedで確認します。生成・registry verifier・publishの入口で同じ検証を使い、upload/RPCより前に失敗させる構成を支持します。未知のmodel IDや欠けた証拠のfallbackは不要です。

不要、または反対するもの：

- 70 verifierの旧E/A・ICT/IRT・Tei・ET等の「passed必須」を72へ持ち込むこと。既存policyと矛盾します。
- 旧provenanceの16件を解決済みに書き換えること。独立実行でも旧auditはdraftでした。72の別判定を根拠付ければよく、旧corridorの科学的主張を修復したことにはなりません。
- 追加refitting、0.5ms、全reserve再実行、新しい生理state、汎用admission framework。今回の境界接続の条件としては要求しません。
- 71 owner、旧variant CLI、研究探索一式のproduction取り込み。必要な物理依存・観測・回帰と再検証可能な証拠だけで十分です。

自動出版をまだ認められない理由は、抽出後の実装／artifactに結び付いたproduction admissionと公開入口の検証が未完成だからです。従来のlocal承認は研究branchの成果物に対するものなので、抽出後のparity・warm checkpoint continuation・Surface/analysis非干渉を確認する必要があります。同一engine内のexact continuationとcross-engine一致も混同しないでください。

補足すると、`ddc7b719`のpublishには研究branchで追加されたglobal provenance guard自体がありません。したがって「既存の公開guardをそのまま継承できる」とは扱わず、72用の必須検証を明示的に接続する必要があります。

以上はadmission境界の設計承認です。registry登録、stable昇格、default切替、公開の実行承認は含みません。ファイル変更なし。

## Runtime extraction review — verbatim

**APPROVE — 72のruntime foundationとして採用可能です。** 数理・checkpoint契約の追加must-fixは見つかりませんでした。ただし、**この差分単独をmerge-readyとは認定しません。**

確認できた内容：

- 72 owner/checkpoint・固定生理fixture・薄いadapterは既承認版と同一。mainのclock高速化も維持。
- 血管追加は指定の2要素に限定。独立実行したcore・血管・construction・70 clock/Surface回帰の計57 testsが成功。
- 修正後の比較は新旧artifact同士の3条件×1000 stepsと最終checkpoint一致を確認する実装。
- artifact-v2の実バイトSHA `04d3b836…`、2,456,516 bytes、revision `e183f825…`、client manifestを独立照合。ブラウザ報告も同じartifactに結び付いています。

残る統合上の問題は1点です。

**既存70 registry CIが壊れます。** [共有hostの追加](/Users/hirakawa/.codex/worktrees/standard72-minimal/0DSimDemo/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1.ts:1)等により、70の再buildは保存artifactと不一致になります。HEADソースだけで再buildすると保存SHAに完全一致するため、今回の差分が原因と切り分け済みです。

したがって、foundationをdraft/non-mergeとして区切り、72 admissionと旧owner・registry gateの整理を含めた単位でmergeする案を推します。旧artifact/lockの無検証更新や、CIを黙って外す対応には賛成しません。

今回の承認はruntime foundationとローカルartifact/Worker証拠までです。登録・公開・default／Workbench切替は含みません。ファイル変更なし。

## Primary decision

Accept the extraction as a non-merge draft checkpoint and the bounded admission
design as the next implementation step. The user's1/2 condition is met within
those scopes. The primary also ran the real70 verifier and reproduced the
deterministic-artifact failure; it is not waived. Source code, report hashes
and test results are linked from [the extraction record](standard72-minimal-integration.md).
