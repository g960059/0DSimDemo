# Population-moment案の閉ループ比較 — 2026-09-06

## 結論

前回の材料単体試験で有望だった「実際の架橋流入率に基づくmoment＋source phi」
を研究専用の閉ループへ接続し、同一条件のLand対照と2/1msで比較した。
**血圧と拍出能力は保ったが、ET・AV勾配・IRTは改善せず、今回のbaseline案には採用しない。**
公開Standard70、baseline、mint gate、knob基準、Model Surfaceは変更していない。

これは「momentモデルすべてが不適切」「Landだけが原因」と証明した結果ではない。
**今回のsource-rate・Ca・幾何・循環の組み合わせでは、歪み回復則だけを変えても
目的を満たさない**という、対応する少数実験の結論である。

[実波形・PV比較図](comparison.png) / [全測定表](MEASUREMENTS.md) /
[集計・dt比較・来歴](analysis.json) / [実行前protocol](PROTOCOL.md)

## 何を実装したか

- 前回の独立6状態 `C,B,W,S,Mw,Ms` 材料に、実装した一次の線形implicit更新の
  **解析的な材料接線**を追加。完全非線形BEや連続時間の弾性率とは呼ばない。
  coldには固定入力の解析平衡と、そのCa/長さ依存を含む接線を用いる。
- 既存の受動弾性、並列SLS、仕事共役なKirchhoff応力、TriSeg幾何と接続。
  受動則のenergy/stress/tangentとSLS modulusは同じ倍率で変わる。
  新たな弁state、L、圧feedback、力のclippingは追加していない。
- 心室/中隔は独自のtagged stateとcodecを持ち、momentsをLandのzeta配列に
  埋め込まない。心房は既存Landをそのまま利用。6状態という個数は同じでも、
  状態の意味と構成identityは別であり、Land checkpointを移植していない。
- 循環・イベント・1拍指標の既存処理は再利用。材料型に依存しない部分だけを
  genericにした。冠循環へのactive-only応力受け渡しは新材料を明示的に識別し、
  受動応力/SLSの二重計上や未知材料の無条件受入れを防いだ。
- 固有状態のexact checkpoint、restore、次周期の同一再計算を確認。
  数値周期性は全身/冠循環/イベント/Ca/幾何/SLSの既存checkを残し、
  population/平均歪みの読み取り専用投影と、実momentの直接差の両方で判定。
  この診断用投影を保存・復元・時間発展させることは禁止している。
- 研究用4条件runnerを追加。新しいSurface、UI、汎用fitting基盤は作っていない。
  派生のET/ICT/IRT/Tei/E/A/形状も既存観測法を使い、正常範囲は改変していない。

## 対応比較の条件と結果

**下表のLand対照は公開baselineではなく、原著速度定数を復元した研究対照。**
HR70、TBV5200mL、Rsys1.10、動脈PV amplitude0.6、受動/SLS1.248、
Ao–SA L=0、Land stretch multiplier1.06、Ca時間scale1.1を共通にした。
Tref120kPa、kuw182/s、kws12/s、Aeff25、phi2.23、beta1はsource。
追加strong-bridge exitなし。動脈PV amplitudeはstorageとcomplianceを共に変え、
「純粋なcompliance単独介入」ではない。すべてのLを除去したわけでもない。

下表は1ms。両者とも独立coldから、従来のfull-state許容値1e-3を3周期連続で満たした。
数値周期性と生理的妥当性は別物である。

| 指標 | Source-rate Land | Moment＋phi |
| --- | ---: | ---: |
| Ao node max/min, mmHg | 125.48 / 80.63 | 124.51 / 79.52 |
| CI, L/min/m² | 2.987 | 2.946 |
| SV, mL | 81.06 | 79.95 |
| ET, ms | 193 | 188 |
| AV mean / peak PG, mmHg | 8.05 / 15.86 | 8.77 / 19.60 |
| ICT / IRT, ms | 39 / 194 | 36 / 204 |
| Tei | 1.207 | 1.277 |
| LV max/min dP/dt, mmHg/s | +3454 / −833 | +3449 / −736 |
| MV E/A（流量比） | 0.863 | 0.829 |
| LVEF / RVEF | 0.531 / 0.501 | 0.521 / 0.489 |
| CVP / mean LAP surrogate, mmHg | 4.25 / 12.38 | 4.36 / 12.66 |

AV勾配は**順行流中のLV–Ao node差**。Doppler勾配、圧回復後のカテーテル差、
表示用の別圧成分を混同しない。dP/dtは受理step間の左室内圧差分である。

2msでもET194→190ms、mean PG7.93→8.67、peak15.57→19.57、IRT194→204ms。
したがって「1msにすると改善方向が反転する」という結果ではなかった。
ただし2/1msだけで最終的な数値収束を証明したとはしない。
2→1msの主要差は、Ao max<0.24mmHg、CI<0.006、ET1–2ms、LV ICT2–3ms、
AV mean1.16–1.55%、LV +dP/dt2.32–2.66%。新案の中央形状指標は約10%変わり、
細かな形状scoreの優劣まで強く主張できない。追加精密化は非採択案には行わない。

## 波形と流量配分

全4条件でLVP/RVPの有意peak数は1。LVP駆出中のpost-peak reboundと、
駆出後半50–90%のPV chord deficitは0。PNGでも単峰性と上辺を確認した。
今回の比較で、問題だった二峰性や後半の下向きのくぼみは再現していない。
ただしこれは評価した窓と閾値での結果で、「全負荷で振動なし」の保証でも、
その上辺がヒト正常の正解だという判定でもない。

一方、1msのAV peak flowは658→746mL/s（+13.3%）。
SVは−1.37%しか変わらず、LVP peakの駆出時間内位置は0.547→0.386へ前進した。
流量集中度 `Qmax × ET / SV` は1.566→1.753。これは記述量で、新しいmint gateではない。
弁を変えずに流量が前半へ集中し、peak PGも+23.5%となったことは整合的である。
**丸いPV loop、同じSW/血圧、良い駆出時間配分は同義ではない。**

同時に変更されたRV/中隔も改善していない。1msでRV ET206→202ms、
IRT139→150ms、Tei0.957→1.030、PV mean PG6.99→7.37mmHg。
LVだけへの介入とは扱わず、RVへの影響も保存した。低/高容量予備能試験や
後負荷試験へは進めていない。

## AV閉鎖後の張力は何で残るのか

[事前の追試protocol](TAIL-DIAGNOSTIC-PROTOCOL.md) に従い、各案自身のAV閉鎖時
材料stateを取り出して200msの入力指定試験を行った。4条件×3path。
実際のCa/長さを再入力したpathでは、記録active応力と全点完全一致した。

1msの閉鎖時LVFW CaはLand0.511、moment0.518µMで、設定peak約0.593に近い。
閉鎖100ms後も0.391/0.398µM。そこで、長さをそれぞれ自身の閉鎖時に固定し、
Caだけを比較した。下表は初期active Kirchhoff応力で正規化。

| 閉鎖から100ms後の残存張力 | Land | Moment＋phi |
| --- | ---: | ---: |
| 実際のCa・実際の長さ | 38.8% | 44.0% |
| 実際のCa・長さ固定 | 43.3% | 48.2% |
| Caを即時floorへ・長さ固定 | 22.3% | 20.5% |

Caの持続駆動を取り除くと尾は明らかに短くなる。しかし即時floorでもRT50は
Land53.2ms、moment49.2msであり、記憶は瞬時に消えない。
これは**Ca入力とtroponin/架橋集団の消退を合わせて検討する根拠**になる。
momentだけを治せばよいとも、Ca波形だけが誤りとも断定できない。
閉鎖後の幾何学的短縮は、この試験ではむしろ張力消退を少し速めていた。

このCa-stepは原因分離のための非生理的な診断入力で、次モデルへの実装案ではない。
AV閉鎖を検知してCaを下げるfeedback、相reset、張力clippingは導入しない。
材料RT50を臓器IRTへ読み替えたり、そのまま血圧改善量を予測したりもしない。

## 次の方針

1. **Source phi-turnoverのbaseline採用と追加Tref/TBV/phi/kwsグリッドは止める。**
   正常な基準状態が出なかった案を、周辺パラメータで救済する探索へ戻らない。
2. 次の材料比較では、Ca入力・長さ依存性・短縮中の力・短縮停止後の消退を
   一組の条件として評価する。等尺性ピークだけに合わせず、共通条件における
   twitch時間配分、短縮速度応答、保持/再伸長応答、固定長での消退を使う。
   Ca sourceの時間shapeと、組織/whole-organへの感受性・基準長の移植も見直す。
   圧波形へCaを直接fitすることや、弁eventを材料へ入力することはしない。
3. Land近傍の係数操作だけに探索を閉じず、**より小さい別の材料形式**も比較する。
   ただし複雑な多状態モデルを先に全身へ組み込まない。population収支、
   応力と歪みの仕事共役性、速度応答と消退、step refinementを材料単体で検証し、
   独立に拘束できないパラメータを増やさない。候補は少数に限定する。
4. 部品群を同時に満たす候補が出た段階で、同じ循環条件での少数閉ループ比較へ
   進む。その後に日常baseline fittingと固定制御low/high preload reserveを再開。
   正常centerと実際の周辺表現余地を一緒に確認し、knob=1への再中心化は最後。

## 検証・計算時間・保存範囲

- 対象67 tests（canonical37＋fast30）、TypeScript、diff whitespace検査を実行。
  全repository suiteや実ブラウザ・全baseline envelopeの再検証は行っていない。
- 最終4並列runは約120.3秒。source Land116/118周期、moment95/98周期。
  最大global TBV誤差2.73e-12mL。採択可能な正常baselineが得られたわけではない。
  周期数が違うため、このwall time差を同一仕事量でのsolver高速化とは解釈しない。
- 初回v1はrunnerがJSONの項目順まで比較し、checkpointを誤棄却した。
  canonicalな全field/hash比較へ修正し、短い4条件smokeとv2を再実行。
  v1/v2の全completed beatとterminal traceがbit一致することを検証した。
  上記120.3秒はこの再実行前のコストや実装/調査/描画時間を含まない。
- 実行ソースsnapshot/hash、未commit差分、条件、失敗run、全trace、固有の
  research checkpoint、最終材料replay、追試・集計・描画コードを保存した。
- 最終点検で、再利用した心房のreadbackが「全5壁Land」と記載していたclaimだけを
  「心房のみLand」へ訂正し、接線のcapに関する説明を精密化した。
  4つの既存checkpointから再計算し、全材料state・圧・容積・流量・event traceの
  bit一致を確認。[最終ソース検証](final-source-verification.json) に差分とhashを保存。
- 公開exact model identity、baseline、gate範囲、Surface/UIは今回変更していない。
  共通処理の型境界・研究材料への明示的な接続・正しいclaimは修正した。
  Git commit/push/PR更新/modelID mintは今回行っていない。

前回までの材料・文献の位置付けは
[component報告](../population-moment-2026-09-06/REPORT.md) を参照。
本報告は新しいヒト正常値の提案ではなく、指定構成内の数理実験とその限界の記録。
