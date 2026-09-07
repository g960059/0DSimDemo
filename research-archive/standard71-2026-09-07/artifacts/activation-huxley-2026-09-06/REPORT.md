# 活性化と架橋を分けた3状態モデルの部品比較 — 2026-09-06

## 結論

**今回の2候補はbaseline採用・閉ループ実装へ進めない。公開Standard70は変更なし。**

Landの6状態を3状態にして、一定Caの力–長さ関係と等尺性波形をかなり近く
再現できた。しかし、同じ短縮軌道での仕事と、Ca低下後の力の抜け方を同時に
改善できなかった。状態数や歪み回復則だけを変更すれば解決する、とは言えない。

[比較図](comparison.png) / [測定表](MEASUREMENTS.md) /
[全解析・数値誤差](analysis.json) / [実行前protocol](component-v3/protocol.json)

ここで比較した対照は**source-rate Landの研究条件**であり、公開baselineではない。
すべて材料へのCa・長さ入力を指定したcomponent assay。
新しいAoP、CI、ET、AV gradient、IRT、Teiや予備能を計算したとは主張しない。

## 何を実装したか

研究専用の3状態材料則、回帰テスト、約2秒の部品比較runnerを追加した。
新しい全身provider・checkpoint codec・UI・Model Surface・mint gateは作っていない。

架橋側は、正規化した結合量 n と張力moment z の2状態とする。

    R = r0 + alpha * abs(lambdaDot)
    dn/dt = r0*a - R*n
    dz/dt = r0*a - R*z + kappa*lambdaDot*n
    nominal stress = Tref*h(lambda)*z

Ca/長さから求める定常活性化 aInf は、source Landの定常 S/rs と同じ代数式。
一定Caでのsource Land平衡との一致を、別実装を使って検査した。
この一致は定常関係の継承であり、Landの動的populationや原著モデルとの同一性ではない。

2つの仮説を比較した。

1. **活性化を遅らせる3状態:** `da/dt = (aInf(Ca,lambda)-a)/tau`。
2. **Ca exposureを遅らせる3状態:** `dc/dt = (Ca-c)/tau` とし、`a=aInf(c,lambda)`。
   cは調節機構への有効Ca exposureを表す独自の縮約変数。
   実際のfree Caや結合Ca濃度、Ca物質収支を表す状態とは称さない。

加えて、調節の遅れを除いた2状態対照も計算した。
前の段階で検討した6状態population-momentとは別の仮説である。

更新はこの小さい方程式に対する後退Eulerの三角消去。入力履歴を変更せず、
populationのclip・正規化・隠れたsubstep・負の張力のclip・AVイベントによる
Caリセット・pressure smoothingは行わない。今回の指定条件では負の張力は出なかったが、
一般の強制短縮で負のmomentが出ないという保証や、完全なATP熱力学モデルではない。

## 文献との距離

二momentの着想は、strainに依存しない総遷移rateと線形架橋ばねの仮定に基づく。
参照論文の一定permissivityの議論を、完成したCa駆動モデルとは扱わない。
今回の1状態調節則との組み合わせは独自の研究仮説。
[Regazzoni et al., generalized Huxley, Eq.17](https://doi.org/10.1007/s10013-020-00433-z)

架橋係数 r0=134.31/s、alpha=25.184、kappa=32.653/0.778 は、
[原著公開human parameter file](https://github.com/FrancescoRegazzoni/cardiac-activation/blob/26f05df28891df7b3c69f16bb136cdced6b63c4d/params/params_RDQ20-MF_human_body-temperature.json)
から取得した。同論文のhuman calibrationにはrat/温度条件からの移用が含まれる。
そのため**ヒト正常境界・本モデルへの正確な移植**とは主張しない。元の20状態
RUモデル、geometry/overlap、stress upscalingは移植していない。
normalized shortening velocityと本モデルのreference lengthの結合も仮定である。
[RDQ20原著のcalibration手順](https://doi.org/10.1371/journal.pcbi.1008294)

## 1. 等尺性の近似はできたが、十分条件ではなかった

各仮説で調整したのはtauだけ。HR70のsource-fit Caとlambda=1/1.1/1.166における
source Landの**全時系列**を近似した。圧・CI・PV上辺は目的関数に使っていない。
Trefを含む定常力の係数も変更していない。

| | 活性化lag | Ca exposure lag |
|---|---:|---:|
| 選ばれたtau | 58ms | 49ms |
| 学習・確認条件の最大RMSE/対照ピーク（1ms） | 2.70% | 6.74% |
| lambda 1→1.166でのピーク時刻の遅れ（0.5ms） | 63.47ms | 0ms |
| 同じピーク時刻差のsource Land | 34.49ms | 34.49ms |

確認条件にはHR60、別Ca時定数、lambda±2%を含めた。
しかし全波形RMSEが小さくても、Ca exposure lagでは長さ依存のピーク時刻差が
失われた。活性化lagも対照の約2倍の遅れを作った。

ここでの10% RMSE screenは、**事前に定義した研究用の近似忠実度screen**。
臨床的正常範囲でも、採用判定の十分条件でもない。公開gateには加えていない。
source Landの時系列自体も実験データではなく、近似一致を独立した生理的validationと
数えない。このため、screenを通ったという理由で候補を閉ループへ進めなかった。

## 2. 短縮中の能力は落ちた

先行研究のsource Landが実際にたどったLVFWのCa/長さを入力し、各材料の状態を
独立に周期定常化した。値は1ms。旧Landの状態を新モデルへ流用していない。

| | Source Land | 活性化lag | Ca exposure lag |
|---|---:|---:|---:|
| 1周期のactive仕事（kJ/m³） | 13.688 | 11.401 | 11.172 |
| 対照からの仕事変化 | — | −16.71% | −18.38% |
| nominal張力ピーク（kPa） | 78.88 | 65.17 | 81.75 |
| ピーク時刻（記録周期内、ms） | 106.89 | 133.87 | 49.95 |

Ca exposure lagではピーク値だけは保つが、仕事が低下してピークが早くなる。
活性化lagでは両方低下した。圧やSVがこの比率で変わるという意味ではなく、
**同じ指定軌道上での材料の違い**である。

0.5msでも活性化lagの張力には、約48msの小ピークから一旦低下し、約133msで
再上昇する形が残った。小さい峰のprominenceは周期ピークの約5.10%。
source Landではこの区間に単一ピークだった。
Ca exposure lag側の局所的な小反転は数Pa規模で、これを同程度の二峰性とは扱わない。
細かい局所反転の多くには元の1ms軌道を補間した入力の影響もあり得る。
**これは新しいLVPの二峰性の証明ではない。** 波形形状は臓器結合後に別途評価する。

## 3. 強制的にCaを切れば改善しても、実際の入力では改善しない

全材料で、記録された同じAV閉鎖近傍から長さを固定した。
それぞれの初期張力に対する100ms後の残存率は以下。

| Ca入力 | Source Land | 活性化lag | Ca exposure lag |
|---|---:|---:|---:|
| 元のCaを継続 | 42.93% | 41.89% | 41.11% |
| 瞬時にfloorへ変更（原因分離専用） | 22.18% | 22.83% | 0.81% |

前半の候補では、実質的に約55–60msの遅れを一つの状態に集め直しただけとなり、
弛緩は改善しなかった。Ca exposure lagはCaを切った試験では速く力を抜けるが、
元のCa入力では同様に張力を維持した。**Ca入力と調節機構をセットで見る必要がある**。
それぞれ開始張力が異なり、比例低下の比較だけで同等の臓器弛緩を意味しない。

Caの瞬時変更は診断操作であり実装案ではない。「AVが閉じたらCaを切る」、
「Caを速くすればよい」という提案にはしない。前回までの閉ループではCaの単純な
高速化がET短縮を悪化させたため、その反証も残る。

## 4. 次に何を変えるべきか

今回の結果は、別の材料則を足し続けるより、**Ca・活性化・長さの基準を一緒に
校正する段階**に進む根拠になった。ただし、どれが生理的に間違っているかの
確定ではなく、Landで解決不可能という証明でもない。

次の比較は次の範囲に絞る。

1. **reference lengthとCa感受性の対応を監査する。** 幾何学のloaded-reference
   stretchと材料のreferenceを、測定されたsarcomere lengthと無条件に同一視しない。
   単にslackを1にする比較は既に未解決だった。振幅だけでなく、異なる長さでの
   ピーク時刻・弛緩・短縮中の力を一緒に再構成する。
2. **独立した公開モデル・入力データを比較基準にする。** 原著公開コードと
   [Zenodo dataset](https://doi.org/10.5281/zenodo.3992553)を確認した。
   取得したisometric CSVは16本の**モデル出力**で、ヒトのraw計測値ではない。
   Ca入力そのものは同CSVにないため、これだけでCa–張力の再fitや正常gateを作らない。
   別モデルを比較用に使うことと、本番へそのモデル全部を移植することは分ける。
3. **複数長さのtwitch・短縮中の仕事・停止後の力・Ca低下後の力を同時評価する。**
   全時系列誤差だけで候補を選ばない。独立した比較で有望な構成だけを少数の
   matched閉ループへ進め、その後でAoP/CIの中心化と低/高容量予備能へ戻る。

ヒト心筋でもCa transientと力の長さ依存性を同時に測った報告がある。
「長さに関係なくCaは必ず一定」という扱いも、唯一の生理的正解とはしない。
今回確認したのは抄録で、定量的な新しいfeedback則やgateへは移していない。
同論文のICTは**intracellular calcium transient**の略で、本アプリの
**isovolumic contraction time**とは違う。
[Vahl et al. 1998](https://pubmed.ncbi.nlm.nih.gov/9618236/)

## 実行・検証

- 最新component-v3: tau校正720回、等尺性180条件、指定軌道24条件、tail48条件、
  ramp96条件。これらは数値実験の条件数であり、独立した生体データ数ではない。
- 部品計算は2.02秒。入力読込・出力保存・今回の実装作業時間は含めない。
  この規模ではworker起動より単一プロセスの一括実行が簡単であり、並列基盤を増設していない。
- 2/1/0.5msで再実行。1→0.5msの全時点誤差/細かい刻みのピークの最大値は、
  source Land 0.86%、活性化lag 1.24%、Ca exposure lag 1.16%。
  2→0.5msでは各2.51/3.40/3.18%。連続時間や臓器全体の収束認証ではない。
- 15本の新規テストを含むcanonical 38本、既存source solver/priorとmanifestの
  fast 10本、合計48本成功。typecheck、git diff --check成功。
  全repository test、ブラウザ回帰、mint資格評価は今回の対象外。
- component-v1からの3系列はv3と全時点で完全一致。
  v2→v3は非有限Ca50の入力拒否追加だけで、計算結果は全件完全一致。
  v3は依存source本文・hash、入力hash、全状態を保存した。
- 最初のpreflightでは研究constructionのmetadata hashまでsource identityと同一と
  仮定して停止した。実数parameter/derived値は一致し、metadataは異なるため、
  primitive/derived値の全項目一致＋追加exitなしの検査に修正した。
- GitHub push/PR更新・mint・公開baseline変更は未実施。出力はlocal artifacts内。

実装:
[component law](../../engine/myocardium/experiments/ActivationHuxleyResearchV1.ts) /
[runner](../../tools/scientific/runActivationHuxleyResearchV1.ts) /
[tests](../../__tests__/activationHuxleyResearchV1.test.ts)
