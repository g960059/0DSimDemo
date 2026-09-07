# 架橋populationと歪みmomentの構造比較 — 2026-09-06

## 今回の判断

公開Standard70、baseline、mint gate、knob基準、Model Surfaceは変更していない。
閉ループへの組み込み、AoP/CI/ET/AV勾配の新しい計算、予備能試験もまだ行っていない。
後負荷試験は実施していない。今回の成果は研究専用の材料試作と、その比較である。

**架橋数と歪みを結び直すだけでは解決しない。一方、元のphiを明示的な近似として
残す案には、仕事を保って短縮後の力の戻りを減らす可能性がある。**
ただし確立したヒト正常モデルとは言えず、元の係数をそのまま流用できる保証もない。
遅いkineticsの採用は保留。次の少数閉ループ比較に進めるなら、まずsource速度の
phi-turnover案と同じparameterのLand対照を優先し、baseline再fitはその後とする。

[比較図](comparison-v2.png) / [全集計と数値精度](analysis.json) /
[符号の追加refinement](sign-refinement.json) / [実行protocol](component-v4/protocol.json)

## 何を変更したか

研究専用 `LandPopulationMomentResearchV1.ts` を追加。元の6状態
`CaTRPN, B, W, S, zetaW, zetaS` の代わりに、別の6状態
`CaTRPN, B, W, S, Mw=W*zetaW, Ms=S*zetaS` を使う。
同じ6個でも意味が違うため、Land checkpointや公開modelIDとして保存・使用しない。

Ca/troponin、blocked/weak/strong population、長さ依存、歪み依存detachment、力の
式の対応は残し、歪み記憶の更新だけを比較した。追加strong-exitは両群で外している。
Tref/Ca/長さの再fit、波形平滑化、力のclipping、状態のresetは入れていない。

厳密に区別した2案は以下。

1. **flux-only**: 新しい架橋は追加歪みゼロ、外れる架橋は集団平均の歪みを持ち出す。
   この仮定でmomentの流出とpopulationの流出を一致させる。平均のdetachmentで
   集団全体を代表させる点は近似であり、歪み分布PDEの厳密な縮約ではない。
2. **phi-turnover**: 上記に、流入に比例した追加の平均歪み緩和を加える。
   係数は元のphi=2.23のまま。新しいstateや数値係数は増やさないが、**これは
   追加の現象論的仮定**であり、1の収支だけからは導けない。
   分散やATPエネルギーから導出できたとも主張しない。

後者の式（incomingW=kuw*U、incomingS=kws*W）:

    Mw' = Aw W lambda' - outgoingW Mw - (phi-1) incomingW Mw/W
    Ms' = As S lambda' - outgoingS Ms - (phi-1) incomingS Ms/S

populationがゼロならmomentもゼロであることを必須にし、epsilon割りや投影で
問題を隠さない。phi=1でflux-onlyと一致。新規流入ゼロなら追加緩和も消える。

比較runnerは、source rates / selected slow ratesの2群に、それぞれ元Land、
Land phi=1、flux-only、phi-turnoverの4案を置いた。群間ではTref等が異なるので、
作用の比較は**同じ群の中**で行う。phi=1対照で交絡を分離した。

## 結果

### 等尺性だけでは案を識別できない

同じCaと固定長を与えた張力時系列は、各群内の4案で全点一致した
（最大差1.23e-9 Pa）。これにはCa入力2種類、lambda=1/1.1/1.166、dt3種類を含む。
等尺性twitchを合わせても、短縮中の力、仕事、短縮停止後の応答は決まらない。

### 単純なmoment収支への置換は、力の不足を招く

下表は、過去の研究候補から記録した**同じLVFWのCa/長さ軌道**を与えた材料単体の結果。
0.5ms。仕事はactive nominal stressに対する `-integral(Ta d lambda)` の右端和で、
心室SW・全心仕事・新しいPV loopではない。単位kJ/m³。

| population設定 | 元Land | Land phi=1 | flux-only | phi-turnover |
| --- | ---: | ---: | ---: | ---: |
| source rates | 16.138 | 11.688 | 11.537 | 16.146 |
| selected slow、extra exitなし | 8.115 | 2.971 | 4.415 | 11.476 |

sourceのflux-onlyで仕事は−28.5%だが、phi=1だけでも−27.6%。このため、仕事低下を
すべて「populationとmomentを結び直した害」と解釈するのは誤りだった。
これを確認してから、phi-turnover案を1種類だけ追加した。prospectiveな追試方針と
先行v1/v2/v3を残しており、初めから決めていた比較とは扱わない。

slowのflux-onlyでは同じ軌道中に最小−2.35kPa、旧AV順行流期間と重なる負値が
約15.5ms現れた。2/1/0.5msすべてで残る。これは描画やwhole-heartのLではなく、
与えた軌道に対する構成則の応答。ただし、強制短縮に抵抗する架橋の一時的負力は
数理的にあり得るため、負値そのものを「病的」「数値破綻」と決めつけない。
既存の正常候補へ無条件で差し替えてよい根拠にはならない、という判断である。

### phi-turnoverには部分的な改善があるが、万能ではない

source群の仕事は元Landとほぼ同じ（+0.05%）、ピーク張力は+4.46%。
slow群では仕事+41.4%、ピーク+35.5%だった。ただしこれは旧軌道を外から与えた結果で、
心拍出・血圧も同じ比率で上がるという意味ではない。

短縮停止時の各案自身の状態から長さを固定し、Caを0.164321µMへ戻した診断試験:

| 指標 | slow元Land | slow phi-turnover |
| --- | ---: | ---: |
| 開始時active stress | 65.53kPa | 46.02kPa |
| 100ms後 | 51.73kPa | 25.69kPa |
| 100ms後/開始時 | 78.9% | 55.8% |
| 停止後の再上昇幅 | 4.25kPa | 0.433kPa |

開始時張力が異なるので、100ms後の絶対値だけで弛緩速度を比較していない。
残存割合でも改善はあるが、尾はまだ長い。Caを保持した場合に張力が回復することは
予期される反応であり、「短縮後の再上昇を全条件でゼロにする」ことを目標にはしない。

また、slow phi-turnoverは旧Ca/長さ軌道の**再伸長時に大きい張力の山が残る**。
添付図で確認した。成分波形の改善をLVPの二峰性解消と読み替えない。

### 時間刻み・符号・仕事の検証

- 2/1/0.5msの比較で、旧軌道のphi-turnover張力の1ms対0.5ms全点最大差は、
  sourceでピークの0.717%、slowで0.792%。2ms対0.5msでは2.11/2.30%。
  材料単体の収束傾向であり、閉ループNewton/ET/勾配の数値品質は未検証。
- 10%/100ms短縮、Ca0.3、lambda開始1.166のslow phi-turnoverは、2msで最小
  +198Pa、1ms−3.82Pa、0.5ms−105Pa。符号が変わったため、この少数条件を
  0.25/0.125msへ追加refinementし、−156/−181Paとなった。微小な負力を無視して
  「全条件で正」と報告しない。2%短縮、10%/20msの強い診断条件も結果に保存した。
- 新しい数値法はCaのBEと、前stepのdetachmentを使う一次精度の線形implicit flux法。
  全非線形BEとは呼ばない。1msや0.5msでの性能だけで公開2ms runtimeに採用しない。
- populationの非負性・保存、ゼロpopulationにmomentを残さないこと、元状態の
  非変更、独自ODEへの一次整合性とrefinementをテスト。
- population/遷移rate/長さ係数を固定した極限で、線形架橋の弾性energy差と
  nominal stress×長さ変化の仕事が一致することを確認。
  **化学反応込みの全energy整合性の証明ではない。**

## 次の作業

1. flux-onlyをそのまま新baselineへ差し替えない。現時点でphiを完全に捨てる根拠もない。
2. 少数閉ループ比較に進む前に、phi-turnoverの材料接線と独自状態codecを検証する。
   現在のproviderはLand stateと解析接線を明示的に仮定するため、同じ6配列へ
   意味の違うmomentを埋めて動かす近道は使わない。必要な境界だけを変更し、
   新たなSurface/UIや汎用モデルframeworkは作らない。
3. 最初の閉ループはsource kineticsでLand対phi-turnoverの対応する少数対照を優先。
   Ca/幾何/循環を同時にfitしない。元来の目的であるET、AV node gradientと、
   ICT/IRT/Tei、dP/dt、LVP/RVP/PV形状、CI/AoPを測る。2msと1msも対応比較する。
4. そこでも正常な作動点と近傍の表現余地が得られなければ、このLand系局所変更を
   続けず、短縮時の力・緩和・長さ依存を同時に拘束できる別の低次元materialを
   比較する。先にTref/TBVの探索箱を広げることはしない。
5. 有望な閉ループが出てからbaseline fitting/固定制御preload reserveを再開する。
   正常中心へ合わせた後も実際の近傍応答を見る。knob=1への付け替えは最後。

## 実装・実行・文献の来歴

- 最新component-v4は1008条件（144等尺性、768短縮/保持、48旧軌道、48停止後）。
  独立した実験データ1008件ではない。component計算約1.23秒、JSON出力等を除く。
  軽い材料試験のためworker並列化は不要だった。追加符号検証20条件。
- targeted test80件成功（新material15、既存reduction8、研究fixture36、Ca15、
  suite manifest6）。TypeScriptとgit diff --check成功。
  全repository/UI/browser/公開baselineの再qualificationは今回未実施。
- protocol hash、入力の元result hash、source13ファイルのhashを検証。
  数値と波形の解析・plotスクリプトを同じartifact directoryへ保存。
- 研究結果はlocal artifacts。今回GitHub push/PR更新/新modelID mintはしていない。

Land 2017は、歪み回復を定常population比と経験係数phiで結ぶ。今回の流入率に
基づく更新は私たちの仮説で、原著の正常性保証を引き継がない。
[原著](https://doi.org/10.1016/j.yjmcc.2017.03.008)

Regazzoni et al. 2020のmoment縮約には遷移rateに特定の仮定がある。
今回の「平均歪みでdetachmentを評価する」案はその厳密な縮約条件を満たすと
確認されておらず、RDQ20実装とは呼ばない。
[原著](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1008294)
