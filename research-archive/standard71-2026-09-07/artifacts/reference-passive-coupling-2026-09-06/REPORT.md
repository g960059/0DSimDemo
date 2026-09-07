# Baseline研究：材料・充満動作点・Ca時間幅の相互作用

2026-09-06。ローカル研究結果。公開Standard70のbaseline/modelID、公開knob、gateの数値範囲、exact方程式、checkpoint schemaは今回変更していない。mint・PR・merge・新候補のWorkbench表示は未実施。

## 結論

安静時の血圧・CIを改善しながら、ET・AV勾配・EF・タイミングの現行必須チェックを満たす研究構成が得られた。独立cold1msでも成立した。ただし、**正常baselineとしての採用完了ではない**。高容量側の応答余裕、充満の内訳、材料参照値と操作範囲、Ca変更の実験的根拠が残る。

選択した研究構成の1ms結果：

| 指標 | 結果 |
| --- | ---: |
| HR / BSA | 70 bpm / 1.9 m² |
| AoP max/min | 121.44 / 82.26 mmHg |
| CI | 3.016 L/min/m² |
| AV ET | 247 ms |
| AV mean/peak gradient | 4.754 / 9.170 mmHg |
| ICT / IRT | 42 / 103 ms |
| Tei | 0.5870 |
| E/A | 0.8138 |
| LVEF / RVEF | 0.5321 / 0.5096 |
| LV EDV | 153.85 mL |
| RV EDVI / ESVI | 84.55 / 41.46 mL/m² |
| PAP max/min | 31.72 / 14.68 mmHg |
| CVP / PCWP surrogate | 4.150 / 11.862 mmHg |
| LV +dP/dt / −dP/dt | +3143 / −1556 mmHg/s |

現行必須rest checksは全通過。±dP/dtは前回までの見直し済みpolicyで参考警告のままであり、今回この候補のために警告化・閾値変更をしたわけではない。EF・E/A・PAP拡張期圧などには大きな余裕がない。全通過を「すべての生理が正常」「収縮力が独立に同定された」と解釈しない。

LVP/RVPは測定上それぞれ有意peak1、LVP/AoPの駆出中post-peak reboundは0、late-PV chord deficitは0。LV圧peakは駆出時間の約76.6%、排出容積の約88.0%にある。PV上辺と時間圧波形を同じ形状指標で評価しない。丸みの診断値と無平滑化図を確認したが、これを健常ヒトの普遍的な「正しいドーム形」と認証してはいない。

## 1. 何を変更して試したか

基準動作点はHR70、TBV5200mL、Rsys1.10、動脈PV則の研究scale0.6、近位大動脈L0、Land slack1.06。AV面積は3.5cm²のまま。原著由来のCaと現在のkineticsを維持した比較から開始した。

- 長さ感受性family1：beta1−2.4 / Tref219054.66Pa。
- 長さ感受性family0.8：beta1−1.92 / Tref238816.55Pa。
- 各familyで受動scale0.832 / 1.04 / 1.248を比較。
- その後family0.8のscale1.04 / 1.248だけで、心室Ca時間幅×1.1を追加比較。

family間のTrefは前回の同一長さでのisometric peak比較に基づく。したがってfamily差はbeta1だけのablationではなく、beta1とTrefの複合差である。受動scaleは平衡受動stress/energy/tangentとSLS modulusの両方を変える。形状や参照幾何は固定し、「拡張能」という単一の実体を同定したとは主張しない。

動脈scale0.6は同じ圧におけるcomplianceとstressed volumeをともに変えるPV則の介入で、閉ループの血液分布も変化する。独立した単一の定数Cだけを調整した実験ではない。L0は既存の原因切り分け構成を引き継ぎ、現実の血液慣性が存在しないとする主張ではない。

Ca時間幅×1.1は既存の研究入力を使用し、matched-alphaのrise/decayを同率で伸ばす。周期的Caのpeak/troughは保つが、Ca積分量と時間履歴は保たない。心房Ca・HR・遅延・心筋kineticsは固定。単なる一般fitting knobでも、実測intact心筋Caの再校正完了でもない。

## 2. 安静時通過と容量応答は同じではなかった

TBV5200→4576/5824mL。既存のfixed-coronary-tone、reservoir-settled protocolで、両心室の低容量・高容量側を測定。以下はLV側。

| 構成 | Rest | 低容量CO変化 | 高容量CO変化 | 高容量PCWP変化 | 高容量LV EDV変化 |
| --- | --- | ---: | ---: | ---: | ---: |
| family1 / passive1.04 / source Ca | 必須全通過 | −17.06% | **−0.47%** | +9.60 mmHg | −0.003% |
| family0.8 / passive0.832 / source Ca | EF・AV勾配・volume等に未達 | −18.01% | **+5.35%** | +7.04 mmHg | +6.19% |
| family0.8 / passive1.248 / Ca×1.1 | 必須全通過 | −17.90% | **+3.66%** | +8.71 mmHg | +3.94% |

最初の単純な構成は、充満圧が上昇してもLV EDVとCOが増加せず、今回のbaseline開発目的には採用しない。これは小さな数値境界の問題ではない。ただし、応答だけから特定の臨床病名を付けない。

受動材料を柔らかくした構成は、PCWPを抑えながら容積と高容量側CO応答を改善した。一方、ETやEFをほとんど改善せず、E/Aにも余裕がなくなる。「柔らかくすれば全項目が改善する」わけではなかった。

最終選択構成はLV/RV両側・両方向の現行response checksを通過。高容量側RVCOは+3.69%、CVPは+2.97mmHg。LV側のCO/PCWP slopeは0.0240L/min/mmHgにとどまり、十分な応答余裕が実証されたとは言わない。高容量側PCWP20.59mmHgを単独で病的と判定することもしない。

なお固定制御centerのLV EDPtmは18.64mmHgであり、PCWP平均11.89mmHgとは別の観測量である。EDPはinlet-valve closureでの定義。今後は平均充満圧だけでなく、心房収縮、残存active pressure、受動/SLS成分、弁閉鎖時刻を合わせて点検する。現時点でこの値を単独の新しい硬いgateにはしない。

### 実測容量負荷研究との比較上の限界

Fujimotoらでは健常者60人への急速saline負荷でPCWPが10±2→16±3→20±3mmHgと上昇し、HR/SV/末梢抵抗の応答も介在した。輸液量はそのまま体内に残った血液量ではない。したがって固定HR・固定制御下のTBV+12%へCO増加率を直接転用できず、「健常なら一律に何%以上増加すべき」とは置けない。これは予備能測定を捨てる理由ではなく、応答の形と測定条件を数値gateの通過から分ける理由である。[Fujimoto et al., Circulation, DOI10.1161/CIRCULATIONAHA.112.111302](https://pubmed.ncbi.nlm.nih.gov/23172838/)

## 3. Ca時間幅でETとEFのトレードオフを一部改善

family0.8 / passive1.248の同一2ms解像度比較：

| 指標 | Source Ca | Ca時間幅×1.1 |
| --- | ---: | ---: |
| CI | 2.986 | 3.013 |
| ET | 238 ms | 248 ms |
| AV mean gradient | 5.053 | 4.764 mmHg |
| LVEF | 0.5176 | 0.5317 |
| E/A | 0.8922 | 0.8173 |
| Tei | 0.5546 | 0.5806 |
| PCWP | 12.468 | 11.888 mmHg |

ET・勾配・EFは改善し、E/AとTeiは悪化した。別条件passive1.04ではE/A0.7823まで低下する。Ca延長を万能策として採用しない。今回の改善は材料・負荷・時間幅の組合せによるもので、「Caを変えればよい」という単独因果の結論ではない。

## 4. 材料単体の試験で分かったこと

### 参照長をさらに短くする案

既存accepted LV length/Ca履歴3本に対し、slack1.06/1.04/1.02をcomponentのみで比較した。幾何・受動strainは変えず、active入力だけを厳密に対応付ける。固定履歴の反実仮想でありclosed-loop予測ではない。

TBV5200の履歴ではslack1.04で、late force約−11.2%、ejection work約−11.6%、filling mean active pressure3.49→2.48mmHg。slack1.02でwork約−24.6%。Trefをworkだけで補償すると約270/317kPaになるが、これは診断上の換算であり、範囲を広げてそのまま実装する根拠ではない。slackだけを短くしてTrefを上げ直す方向を主経路にはしない。

### Ca感受性のsource transferを解析式で監査

Land原著のskinned-cell fittingはCaT50Ref2.5µM、beta1−2.4を報告し、intactへの移行ではCaT50Ref0.805µMやnTmなどが変更される。原著のλはSL/SL0で、rest SLは細胞ごとの推定値である。これらは同一準備・同一参照で得られた一組の測定値ではない。[Land et al., 2017, DOI10.1016/j.yjmcc.2017.03.008](https://pubmed.ncbi.nlm.nih.gov/28392437/)

ここからの独自数理監査：固定長・固定Caでpopulation balanceを代数的に解き、既存exact RHSと反復initializerで照合した。36点、最大state差6.73×10⁻¹¹。集計時間約42ms（プロセス起動時間を除く）。runtime initializerは変更していない。

各長さのforceをその長さでの飽和forceで正規化すると、steady force–Ca曲線の横方向の移動は

`ΔpCa50 = log10[CaT50(short) / CaT50(long)]`

で決まり、Trefとforce-length振幅は相殺する。force半最大点とCaTRPN半活性点は同一ではない。λ0.95→1.15という説明用対比では、CaT50Ref2.5/beta1−2.4で0.0879、0.805/−2.4で0.3178、0.805/−1.92で0.2412となった。最初の行は**affinityだけの比較**で、skinnedモデル全体の再構成ではない。

つまり次元を持つbeta1をそのまま保ってCaT50Refを変えると、相対的な長さ感受性beta1/CaT50Refは変わる。このモデル内事実は確認できたが、原著全体の誤りや現モデル不正をこれだけで断定しない。

Tannerらのdonor permeabilized myocardiumでは37°C、SL1.9→2.3µmでΔpCa50約0.07が報告される。donorは6心臓で、複数stripは技術的反復。intactへの測定条件差と、organ幾何からSLへの参照写像が未校正であるため、0.07に直接fittingしない。λ0.95/1.15との対応もSL0=2.0µmを仮定した説明上の写像にすぎない。[Tanner et al., 2023, DOI10.1085/jgp.202213200](https://pubmed.ncbi.nlm.nih.gov/36633584/)

この解析式は、今後の材料候補を毎回closed-loop定常化する前に落とす、安価なcomponent screenとして使える。識別性のないパラメータを自動同定する機構や、新しいfitting frameworkは追加していない。

### 正値log-affine affinity則は採用しない

値と一次傾きをλ1で一致させる正値の指数型CaT50則を、追加stateなしのcomponent反実仮想として比較した。既存kernelへCa/CaT50比が一致する入力変換を行う解析専用adapterであり、source Caの変更や実用runtime lawではない。

選択履歴ではlog-affine/beta1−2.4でlate forceは約+0.45%と保たれたが、work−2.8%、filling active pressure+8.9%。弱い傾きでは残存forceを抑える一方、workを約14.4%失った。明確なjoint winがなく、新しいconstitutive lawを実装する根拠はない。正値という数学的利点だけで熱力学的・生理的に正しいと主張しない。

## 5. 数値品質・速度・実装上の小修正

- 12本の科学的計算が完了。各条件は独立cold、既存hot-path-leanで定常化、terminalは詳細記録、materialは追加1周期だけreadback。
- 受動factorial6本は4workerで約145秒。初回reserve2本は2workerで約123秒。Ca追加2本は約79秒。選択候補reserve自体は約39秒、fine coldは約130秒。workerを併用したwall timeであり、単一計算の高速化率ではない。
- 2ms→1msで選択候補のCI差+0.117%、AVmean差−0.202%、ET差−1ms、±dP/dt差約1.2〜1.5%。fineでも必須rest全通過。2解像度比較であって、漸近外挿・fine reserve・専用pressure-rate spike quality認証ではない。
- fine terminal TBV誤差最大1.82×10⁻¹²mL、continuity residual最大2.41×10⁻⁸mL、material圧再構成誤差2.84×10⁻¹⁴mmHg。
- 最初のfine requestでは、dtをjob JSONに書いたためrunnerのCLI設定2msが使われる不整合を発見。誤ったworkerをresult保存前に停止し、別directoryで`--dt-sec .001`として再実行した。未完了attemptは残し、集計から除外。最終集計は**result自身のdtとconstruction identity**を検証する。
- 今回の共有コード変更は、この取り違えを防ぐ研究jobの未知field/boolean/initializationチェックと、result欠落時のCLI失敗扱い。exact数式・solver・checkpoint・Surfaceは変更していない。
- 関連5ファイル89テスト、typecheck、実CLIの未知dt field早期拒否を確認。全repository・公開mint・Workbench回帰の完了を意味しない。

## 6. 採否と次の方針

1. 今回のCa×1.1 / passive1.248構成を**研究用の比較anchor**として保存する。血圧・CI・駆出・充満指標の同時成立は前進だが、公開baselineにはまだ採用しない。
2. 無限にgate境界を追うgridは増やさない。次の主題は、平均充満圧が許容域でも高容量側のCO増加が小さい理由を、弁閉鎖時EDP・心房寄与・残存active pressure・長さ感受性から切り分けること。
3. Tref238.8kPaは私的intervention上限240kPaに近く、通常baseline探索域の外、動脈scale0.6もintervention下限である。これらは人口正常限界ではないが、公開knobを1へ付け替えるだけで実験余裕が増えるわけではない。absolute材料参照値の意味・実現stress・source準備差を監査し、範囲と操作余裕を採用前に扱う。都合よく境界だけを拡張しない。
4. Ca時間幅は今回のjoint improvementに寄与したが、拡張期とのtradeoffが残る。実測から識別できないものは未識別として残す。安静時の典型値、負荷応答、数値品質、モデル作成上の操作余裕を分け、gate数値の変更が必要なら候補の採否と独立に根拠を記録する。
5. 新state・新材料則・汎用optimizer・cloud化は今回不要。既存の並列/軽量実行と、安価な材料単体試験を先行させる。後負荷stress試験は行わない。

## 証拠

- [全計測表](MEASUREMENTS.md)
- [数値比較・構成/結果hash・未完了attempt・検証記録](final-analysis.json)
- [最終source snapshot](final-source-snapshot.json)（各runにも実行時snapshotあり）
- [受動材料比較図](passive-comparison.png)
- [Source Ca2ms / Ca×1.1候補1msの無平滑化比較図](calcium-candidate-comparison.png)（純粋Ca差は同じ2msの計測表を使用）

図の軸内に全curveが収まることを生成時に検証し、PNGも目視した。経過は恒久READMEへ重複記載しない。これらは現時点ではlocal artifactsで、GitHubに保存済みという意味ではない。
