# 駆出・弛緩・長さ依存性の切り分けとbaseline動作点の再評価

2026-09-06。研究worktreeでの結果。公開baseline、modelID、公開knob範囲、checkpoint schemaは変更していない。新候補のmint・PR・mergeは行っていない。

## 結論

**AoP約123/83 mmHg、CI約3.05を作れる研究候補は得られた。しかし、baselineにはまだ採用しない。**

理由は「5.18 mmHgや51.8%が閾値を僅かに外れたから」という一項目の判定ではない。圧・CIを上げた動作点では、ETが238 msと短めのまま、EF/ESVの余裕が小さく、容量を12%追加してもCO増加は3.16%にとどまり、PCWP surrogateは7.73 mmHg上がる。現行の予備能gateを通っても、今回求めている使いやすいbaselineの十分な余裕は示せていない。

一方、検討方向は絞れた。

- 強結合解離を遅くするだけでは、ET改善より弛緩遅延が大きい。
- recruitmentとshortening distortionの限定factorialでは、圧・ET・EFのトレードオフが残る。
- **Ca波形を保ったまま、長さ依存Ca感受性を見直す方向には可能性がある。** ただし、参照長・張力スケール・実際の心室容積との対応まで同時に検証する必要がある。一点の等尺性最大張力を揃えるだけでは不足する。

全数値は[前半の測定表](./MEASUREMENTS.md)と[後半の測定表](./MEASUREMENTS-FOLLOWUP.md)。構成、元結果SHA、圧寄与、数値差分は[最終集計](./final-analysis.json)。旧結果は上書きしていない。

## 1. 今回の範囲と比較方法

前回の研究候補を対照にした。公開Standard70そのものとの一因子比較ではない。

共通の対照条件はHR70、TBV5050 mL、Rsys1.05、systemic arterial compliance research scale0.6、Ao-SAのL=0、ventricular passive scale1.04、Land slack stretch1.06、Tref219.055 kPa。AV EOA3.5 cm²など弁条件は保持した。Ca波形とCa ownerは全条件で保持した。L=0と参照長1.06は前段階からの研究設定であり、今回初めて変更した因子ではない。

まず既存のCaと固定長・処方した短縮履歴を使うcomponent実行で作用を切り分け、少数だけ閉ループへ戻した。固定長の最大張力を揃える基準はLand stretch1.166。これはモデル内で比較を揃えるための基準であり、実測された正常張力や同一の全心室収縮力を意味しない。処方履歴のwork/圧寄与も、閉ループへの因果効果そのものではない。

閉ループは解離4条件、recruitment/distortion 4条件、長さ感受性の容量2条件、動作点2条件を比較し、選択した1候補のみ正式予備能と1 ms確認へ進めた。E波未解決の1条件は診断情報を保持するため再実行した。後負荷stress/qualification試験はしていない。最後のRsys1.10は通常のbaseline構成調整であり、負荷試験ではない。

## 2. 解離を遅らせればETを延ばせるか

現在の追加解離則は、CaTRPNに依存するgateと「zero-distortion平衡を越えた強結合分画」にのみ作用する。従って、rateを変更しても定常平衡そのものの残存張力は除けず、主に過渡的な強結合過剰分の消失速度が変わる。今回の固定長平衡計算でもrate間の差は収束誤差内だった。

2 ms、等尺性最大張力を一致：

| 解離rate / gate power | AoP | CI | ET ms | IRT ms | Tei | AV mean PG |
| --- | --- | --- | --- | --- | --- | --- |
| 60 / 16：対照 | 113.8/76.5 | 2.915 | 236 | 94 | 0.598 | 4.836 |
| 30 / 16 | 113.6/76.8 | 2.924 | 242 | 120 | 0.707 | 4.705 |
| 120 / 16 | 113.6/76.0 | 2.897 | 228 | 84 | 0.566 | 5.087 |

30/sではETが6 ms延びる一方、IRTが26 ms延びた。解離を完全に外すとperiod-1には収束するが、LVP低下が遅く、早期充満が心房収縮側へ寄り、独立したE波を検出できなかった。部分的なexact観測ではET264 ms、AoP100.1/69.8、CI2.576。この条件から有効なE/A・IRT・Teiは報告しない。

これはNewton solver破綻と同じではない。診断再実行では433点の有限なaccepted waveformを保持し、`unresolved-e-wave`を明示した。[実際のLVP/LAPと僧帽弁流](./no-exit-filling.png)を確認した。

処方した高容量短縮履歴では、解離を外しても駆出後半の力やworkはほぼ増えず、充満期のactive圧が大幅に増えた。**単純な解離低下は、今回の解として採らない。** なお、閉ループでは長さ履歴自体が変わるため、固定履歴の圧寄与増加を任意の時相の閉ループ圧増加へそのまま読み替えない。

## 3. recruitment × shortening distortionのfactorial

既存の`kws`を0.8倍、`phi`を1.2倍にする2×2比較を行った。`phi`は固定長の波形を変えず、短縮中のdistortion dynamicsを変える。`kws`はrecruitmentだけでなく、そこから導出されるdistortion rateにも影響するため、単独で「収縮を長くするknob」とは呼べない。

| kws倍率 / phi倍率 | AoP | CI | ET ms | AV mean PG | LVEF |
| --- | --- | --- | --- | --- | --- |
| 1 / 1 | 113.8/76.5 | 2.915 | 236 | 4.836 | 52.4% |
| 1 / 1.2 | 117.9/77.9 | 2.988 | 222 | 5.692 | 54.5% |
| 0.8 / 1 | 109.2/74.8 | 2.824 | 250 | 4.096 | 50.2% |
| 0.8 / 1.2 | 113.2/76.2 | 2.898 | 236 | 4.753 | 52.1% |

圧とEFを改善する側はETが短くなり、ETを延ばす側は圧・CI・EFが低下した。組合せは改善をほぼ相殺した。この限定範囲で有用な両立は得られなかったので、さらに細かいgridには進まなかった。「全ての組合せが不可能」という証明ではない。

全条件で有意なLVP/AoP peakは1つ。slow-kwsの後半PV chord deficitは僅か0.0244 mmHg、他は0だった。これらは形状記述であって、臨床正常の認証ではない。[比較図](./recruitment-contrast.png)。

## 4. 長さ依存性を変える二つの方法は同じでなかった

### 原著を読み直して確認した境界

[Land 2017](https://pubmed.ncbi.nlm.nih.gov/28392437/)の著者稿で、長さ依存性・intact調整・whole-organ比較を図も含めて確認した。長さ依存の校正はskinned cell 5個・3長の測定を用い、intact/whole-organへの調整は別の測定条件と組み合わせている。論文は、同一条件のintact force・length・Caデータが揃っていないことも述べている。原著3Dモデルの形状・充満条件は、今回の閉ループ5-wallモデルと同一ではない。

従って、原著パラメータを無条件の全臓器真値とは扱わない。一方、このことは今回の変更値を生理学的に検証済みとする根拠にもならない。

### A. 等尺性基準点のCa感受性を固定し、傾きだけ緩める

beta1を0.8/0.6倍にし、CaT50Refも同時に変えて、stretch1.166でのCa感受性を固定した。基準点の等尺性波形は同じになったが、処方した高容量充満履歴ではactive圧がむしろ増加した。固定長の長い側だけを見ると残存張力は減るため、固定長の一点だけで選ぶと判断を誤る。この方向はcomponent段階で止めた。

### B. 原著CaT50Refを固定し、長さ感受性の傾きを緩める

CaT50Ref0.805を保持し、beta1を−2.4から−1.92へ変更した。等尺性最大張力を揃えるTrefは238.817 kPaとなる。処方した高容量履歴のphase0.7ではactive圧が7.81→5.37 mmHg、充満期平均は7.50→4.94 mmHgへ下がり、駆出後半の平均張力低下は約1.8%だった。ただしworkは約9.2%低下し、閉ループでの両立は別に確かめる必要があった。

Trefは旧研究intervention上限237.6 kPaを0.512%越えるため、閉ループ実行前に私的研究上限のみ240 kPaへ変更した。これは生理的正常上限の変更でも、公開fitter/knob範囲の拡張でもない。beta1を0.6倍にすると必要Trefが271.6 kPaになり、その枝は閉ループへ進めなかった。

0.8倍のTBV5050→5656 mL独立cold比較では、CI2.936→3.169、CO増加7.96%、PCWP10.38→17.09 mmHgとなった。これは正式固定制御の予備能認証とは異なり、また次節のbaseline動作点とも異なる。**「予備能約8%を確保したbaselineが完成した」とは言えない。**

## 5. 圧・CIを上げた動作点の最終確認

材料を固定し、通常の構成調整としてTBV5200/5300 mLとRsys1.10を試した。5300は圧・流量がさらに上がるが充満圧・容積面の余裕が減るため、5200のみ詳細確認へ進めた。TBVとRsysを同時に変えているので、それぞれの独立な寄与はこの比較から推定しない。

### 5200 mL候補：独立cold、1 ms、full-invariant

| 指標 | 結果 |
| --- | --- |
| AoP max/min | 123.25 / 82.73 mmHg |
| CI / SVI | 3.046 L/min/m² / 43.51 mL/m² |
| ET / ICT / IRT | 238 / 41 / 100 ms |
| AV mean / peak gradient | 5.180 / 9.763 mmHg |
| Tei / E/A | 0.592 / 0.841 |
| LVEF / RVEF | 51.81% / 49.85% |
| LV EDVI / ESVI | 83.99 / 40.48 mL/m² |
| RV EDVI / ESVI | 87.29 / 43.78 mL/m² |
| PCWP surrogate / CVP | 11.69 / 4.00 mmHg |
| PAP max/min | 31.96 / 14.53 mmHg |
| LV maximum/minimum dP/dt | +3252 / −1667 mmHg/s |

現行rest corridor外はAV mean gradient、ET、LV ESVI/EF、RV EDVI、PV mean gradient。±dP/dtは旧狭い範囲に対する参考警告として残る。LVP/RVP/PAPの現行単峰・ringingチェックは通り、駆出中LVP/AoPのpost-peak reboundと後半PV chord deficitは0だった。

ただしLV pressure peakは駆出時間の77.5%、駆出volumeの88.5%の位置にある。**二峰性がないこと、chord deficitが0であることだけで、典型的なヒトの丸いPV loopを再現したとは言わない。** [2 ms / 1 msの実波形比較](./candidate-resolution.png)はaccepted endpointsを平滑化せず描画し、目視と軸クリッピングを確認した。Workbenchの公開baseline画面を差し替えた図ではない。

2→1 msでAoP maxは+0.13 mmHg、CIは+0.10%、ETは−2 ms、AV mean gradientは+1.50%、正/負dP/dtの大きさは+1.89%/+1.19%。大きな形状差はないが、2段階の感度確認であり、連続時間解への収束証明や専用pressure-rate qualityの全項目再認証ではない。最大TBV誤差は1.82e−12 mL、coronary ledger誤差7.93e−13 mLだった。

### 同じ動作点の正式低・高容量応答：2 ms

既存の固定coronary tone・reservoir-settled protocol。TBV5200→4576/5824 mL。

| LV側 | 低容量側 | 高容量側 |
| --- | --- | --- |
| CO変化 | −17.62% | +3.16% |
| 充満圧変化 | −4.37 mmHg | +7.73 mmHg |
| EDV変化 | −15.25% | +3.94% |
| EDP transmural変化 | −8.66 mmHg | +4.69 mmHg |

RVの高容量CO増加は3.19%、CVP+3.10 mmHg。左右・低高の4方向応答は現行gateを通った。しかし高容量側は、最低限の工学的floorを僅かに上回る程度である。PCWPは11.71→19.44 mmHg、COは5.781→5.963 L/min。低容量側と高容量側が対称に応答する必要はないが、今回の目的に対し十分な上向き余裕とは判断しない。

予備能測定は2 msであり、1 msでの再認証は行っていない。遠いpublished referenceからのwarm startは195周期を要し、この候補のcold 139周期より遅かった。定常解はAoP差0.004 mmHg未満、CI差0.003%未満で一致したが、warm startなら必ず速いとは言えない。

### 長さの上限へ再び達した

候補のLVFW Land stretchは1.00550–1.20587。accepted endpointをdtで重み付けした約10.3%の区間で、長さ依存性のcap1.2に達していた。SEP/RVFWはこのcap未満。低い動作点TBV5050では最大1.19297でcap未満だった。

これはモデルのCa感受性と長さ増強が頭打ちになる領域で、さらなる充満の効果を制限し得る。ただし、cap到達だけが予備能低下の原因と確定したわけではない。受動硬さ、残存active張力、動的短縮、循環動作点も連動する。また、Land stretchは臓器幾何から渡す無次元量であり、直接測定したサルコメア長ではない。cap越えを即座に「生理的不可能」とするgateは追加していない。

## 6. gateに対する判断

今回、候補を通すために数値cutoffを変えていない。前回分離した「丸み・peak位置」「±dP/dt」の参考警告方針も維持した。

[Alhakakらの心時相参照研究](https://link.springer.com/article/10.1007/s00392-023-02269-2)を確認した。測定はcolor-TDI M-modeで、HR・性差がある。男女別補正式の中心をHR70へ換算するとLVETは約275/287 msだが、著者ら自身が測定法間の一般化に制約を述べている。今回のhydraulic forward-flow ETに、その数値をそのまま必須gateとして移してはいけない。同時に、候補238 msを正常中心と積極的にみなす根拠にもならない。

判断の中心は、狭い境界の内外ではなく、**出力全体の整合性と余裕、測定定義、負荷応答**とする。TeiはICT/IRT/ET、CIはHR/SVIと従属関係があるため、複数の独立した収縮力証拠として重ね数えない。予備能floor合格も、そのbaselineに豊富な実験余裕があるという意味には拡張しない。

現時点では、新しい曲率正常値やESPVR/PRSWの必須閾値を増設するより、既存の波形・時間・容積・圧・固定制御応答を合わせて選ぶ方が適切と考える。

## 7. 実装・速度・次の作業

今回のコード追加は研究fixtureとrunnerに限定した。

- boundedな解離rate/power、recruitment/distortion、固定CaT50Refの長さ感受性probeを追加。非defaultはinterventionのみ。原著値とruntime値を分け、derived parametersを再計算し、構成hashに反映する。
- default相当の明示入力は同じidentityへ正規化し、null・余計なfield・二重のprimitive ownerを拒否する。
- 観測器がE波などを解決できない場合も、定常化判定・exact beat・accepted traceを失わず、部分証拠として保存する。失敗をbaseline合格や公開checkpointへ変換しない。
- 公開Ca、model/Surface identity、公開baseline、UI/controllerは変更していない。

component screenは各batchが約0.3–0.7秒。閉ループ4条件batchは約49–87秒、2条件batchは約79–87秒で、条件間並列を利用した。最終予備能込み約152秒のうちreserve自体は46秒。1 ms確認約260秒と並行実行した。重い正式検証を全探索点へ掛けることは避けた。新しい最適化基盤や追加stateは作っていない。

次は以下へ絞る。

1. **今回の候補を公開baselineにせず、TBV/Trefの追加だけで押し切らない。** 圧・CIが作れることは確認できたため、同じ方向の微細gridを続ける価値は低い。
2. **参照長・長さ依存Ca感受性・受動充満の整合性を、短縮中の力と一緒に調べる。** 最大等尺性張力の一致は比較の基準に留め、唯一のfitting目標から外す。原著のcapを便宜的に上げたり、Ca floorだけを下げたりしない。
3. 既存の低/通常/高容量のaccepted履歴をcomponent検証へ再利用し、駆出後半の力を保ちつつ充満時のactive成分を減らせる変更だけ少数の閉ループへ戻す。材料・参照幾何を闇雲に同時最適化せず、独立に識別できるかも見る。
4. 圧・CIの目標動作点に移した**後**、その動作点を中心に予備能と数値解像度を再確認する。低い動作点の良いreserveをそのまま持ち越さない。近傍checkpointは材料/条件identityを区別して利用し、遠いreferenceからのwarm startを速度改善と決めつけない。

関連16ファイル・256テスト成功。`tsc --noEmit`成功。全repositoryテスト、mint認証、実Workbenchでの新候補確認を完了したという意味ではない。実験入力・原結果・source snapshot・図・棄却理由はこのartifact directoryに保存し、恒久READMEには経過を重複記載しない。現在はlocal evidenceであり、まだGitHubへ保存したとは言わない。
