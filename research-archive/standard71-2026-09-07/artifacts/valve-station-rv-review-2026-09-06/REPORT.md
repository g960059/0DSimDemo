# 採用候補の圧表示・4弁・左右PV loopの診断

## 対象と結論

2026-09-06の研究baseline採用候補（HR 70/min、TBV 5250 mL、1 ms）を対象とする。
公開Standard70 baselineは未差し替えであり、以下の数値を現在のwebappの任意の状態の数値とは主張しない。
コード・gate・Surface・公開modelIDは今回は変更していない。

結論は、圧差の見た目には軸倍率の影響が大きいが、PVの背景抵抗と圧観測位置には実質的な検討課題もある、というもの。
左右のPV cornerは同じ形である必要はない。しかし「単峰で振動しない」だけで正常RV形状を検証したとは言えない。

## 再現性

`inspect-valves.ts` が既存のqualified checkpointを同じ研究constructionにrestoreし、full-invariantで1周期のみ再生した。
再生時間は約1.90秒、accepted traceは既存のmaterial replayとcanonical JSONで完全一致した。
独立した長時間定常化・parameter探索は実施していない。
全4弁についてaccepted開口状態を使って弁の構成式を再評価したところ、元の流量との差は0、圧収支残差は最大約3.6e-15 mmHg。
`measurements.json` と `accepted-valve-readback.json` に出所hashと数値を保存した。

## 圧の位置と圧差

現在のStandard70が用いるworkbench Surfaceでは、AoPは `hemodynamics.pressure.absolute.Ao`、PAPは `hemodynamics.pressure.absolute.PA`。
候補図も同じraw compliance-node圧を使用している。両者ともZc×Qを追加していない。
一方、過去のStandard66/67のselected outflow SurfaceはAoPをproximal constitutive portへ対応づけていた。
したがって、ユーザーの以前のAoPについての記憶と現在の実装は区別が必要。

現候補は局所圧回復、圧波の伝播・反射を明示的には扱わない。0Dのcompliance nodeは、特定のカテーテル位置でもvena contractaでもない。
現在の二次圧損を、そのままカテーテルでの回復後勾配またはDopplerの最大局所勾配と同一視しない。

| 指標 | AV | PV |
| --- | ---: | ---: |
| production beat平均node勾配 (mmHg) | 4.5405 | 4.6786 |
| production beat最大瞬時node勾配 (mmHg) | 8.4802 | 7.7945 |
| 研究設定の最大EOA (cm²) | 3.5 | 4.0 |
| 背景抵抗 (mmHg·s/mL) | 0.0015 | 0.0050 |
| replay最大勾配時の線形圧損 (mmHg) | 0.7292 | 2.3206 |
| replay最大勾配時の二次圧損 (mmHg) | 7.7510 | 5.4738 |
| 同時点の開口割合 | 0.9947 | 0.9888 |
| 同時点のEOA (cm²) | 3.4814 | 3.9553 |

最大勾配は同時刻の圧差の最大値であり、心室圧の最大値から動脈圧の最大値を引いたものではない。
候補図の左圧軸は0–140、右は0–40 mmHg。同じmmHg差は右で3.5倍の高さを占める。
また右心系では同じ絶対圧差でも心室圧に対する比率が大きい。この点は単なる表示倍率とは別。

全4弁の現行forward lawは `ΔP = R_bg Q + B(EOA) Q |Q|`。
PVのR_bgはAVの3.33倍である。accepted右端点でforward期間を積分すると、平均線形圧損はAV約0.49、PV約1.61 mmHg。
これはPV平均圧損の約34%を占める。これは現行解の圧損内訳であって、Rを変えた閉ループ解の効果を予測するablation結果ではない。
このR_bgは現在の定義では旧topology由来の背景損失であり、この正常成人候補のPV圧損データから同定した値ではない。

注意：右端点積分の平均はAV4.5593/PV4.6966で、production observerの線形補間・台形積分による上表の平均とは異なる。
数値の役割を分け、正式outputを診断用積分に置き換えていない。

Zcは圧回復とは別概念である。仮に `P_prox = P_C + Zc Q` を採用するなら、弁・近位血管がこの同じport圧に結合し、圧力仕事も整合する必要がある。
表示だけPAPへZcQを加える修正では、グラフ上の弁圧差と実際の構成式の圧差が乖離する。
PS誤認の懸念は妥当だが、圧差を視覚的に隠すのではなく、観測位置と損失モデルを検証するのが先。

## LV/RVの左上corner

時刻は1 ms accepted gridのforward flow消失を基準とした。これは解剖学的な弁尖閉鎖時刻ではない。

| 指標 | LV/AV | RV/PV |
| --- | ---: | ---: |
| 心室圧最大 (mmHg) | 124.104 | 33.690 |
| 初めて流量0になる点の圧 (mmHg) | 117.033 | 28.555 |
| peakからflow 0まで (ms) | 65 | 83 |
| peakからの圧低下率 | 5.70% | 15.24% |
| 圧peak時点で残る駆出量 / SV | 12.64% | 19.74% |
| 圧peakの駆出内時相（右端点定義） | 75.66% | 69.26% |
| flow 0になった時の開口state | 0.3948 | 0.3959 |

RVはLVより早く圧低下へ移り、より多くの血液をその後に駆出している。そのためRVの左上はより丸くなる。
孤立した駆出期間には `dV/dt = -Q_out` なので、`dP/dV = -(dP/dt)/Q_out`。
圧低下と流量減速の比、壁形状と短縮の関係がcornerを決める。軸をそろえても形の差は残る（`comparison.svg`）。

ただし、Qが0になっても開口stateは両弁とも約0.4残っている。現行lawは逆圧・EROA=0では流量を即0にするhydraulic supportを持つ。
開口stateは幾何学的弁尖運動そのものではない。また弁流量の慣性stateがないので、逆圧差のもとで慣性による順行流が続く現象はこのlawでは表せない。
これは異常振動の証拠ではなく、閉鎖付近の形を解釈する際の構造上の限界。
今回の候補ではAo→SA、PA→PArtの近位Lも0。旧topologyの弁L欄を、現行4弁lawが実際に使うLと読み違えない。

臨床データとの比較では、RVをLVと同じ矩形にそろえる目標は不適切。
[Richter et al. 2021](https://pubmed.ncbi.nlm.nih.gov/33655769/) は侵襲的PV計測で、肺血管負荷と三角形・矩形・台形・notched形状の関連を報告している。
正常側のRVはLVより丸く、より早い圧peakを持つという解釈を支持する。一方、この研究はPAH 77例と非PH 15例で、無作為健常者の正常範囲を定義する研究ではない。
本候補のRVは約69%時相にpeakがあり、まだかなり後半。単峰性でも正常RVの時間的輪郭を十分に再現したとは断定できない。
この形のみを根拠に、候補を肺高血圧またはPSと診断することもできない。

[Gardin et al. 1984](https://pubmed.ncbi.nlm.nih.gov/6695664/) の正常成人20例では、上行Aoと主PAの流速・加速・ETは同じではない（ET平均294/331 ms）。
これは左右を同じET・同じ流形状へそろえない理由になるが、PW Dopplerの主血管速度を本モデルのQ/EOAに直接当てはめる正常範囲にはしない。
候補のproduction ETはAV268/PV271 msで、右の延長は小さい。この点もshapeと合わせた評価対象で、直ちに新しい数値gateを増設する理由にはしない。

## 共通構造と非対称性

- LV自由壁・中隔・RV自由壁は同じCa源、Land系能動則、受動則・SLSの枠組みを使用する。今回のCa時間形状、Tref、Ca感受性、stretch基準、bridge動態の共通変更はRVにも及んでいる。
- TriSegで壁の幾何・壁量・伸長・負荷と中隔結合は左右で異なる。同じ自由Caでも伸長履歴が異なり、結合Caとcrossbridge状態・実際の応力は同じにはならない。
- RV内の流入部・流出路を空間分割した伝播モデルではない。領域別の活性化時差を別に再現していない。
- AV/PV/MV/TVは同じ準定常orifice流量＋1つの開口memoryの構造。流量memoryと弁Lはない。面積・背景R・開閉時定数は各弁で違う。
- MVのみ開口driveに0.6 mmHgのdeadbandがある。TVへ自動的に同じ値を入れるのではなく、MV側の意味とE/A・ICT・充満への影響を先に検証する必要がある。
- AVの圧回復port構造は現在の候補には使われていない。PVだけ同構造への移行が漏れている状態ではない。
- 公開Standard70はPA→PArtをL=0にした一方、源のAo→SAのLを維持する。研究候補は後者も0。公開版と候補の差を混同しない。

## 残る課題と推奨順序（未実施の計画）

1. **現候補を固定した比較基準として保存する。** AoP・CIを上げられることは確認できた。さらに全parameterを同時に動かす探索へ戻らない。研究candidateとしての採択と、公開baseline/modelIDとしての妥当性・実装完了は別。
2. **AV/PVの圧損と血管の圧観測位置を先に監査する。** R_bg、EOA/velocityの定義、圧回復、近位complianceへの容量配分と特性インピーダンスを分ける。共通心筋設定を固定して小規模な因子分解を行い、変えるもの・変えないものを明示する。表示のみの補正、PV gradientを通すためだけのEOA拡大はしない。
3. **RVの時間形状・閉鎖cornerをこの結果と一緒に評価する。** 圧peak時相、圧低下中に残る駆出量、PV閉鎖付近の流れを記録する。形状に妥当な根拠があれば、必要最小限の構造変更を検討する。最初からRV用Ca自由度やLを追加しない。Lが必要な場合も、既往の振動を踏まえて所有位置・減衰・数値整合性から設計する。
4. **次にMV/TVと拡張期の観測定義を整理する。** volumetric E/AとDoppler速度E/Aを区別し、開口memory・MV deadband・背景Rを確認する。RV/他弁へLVの閾値を横流ししない。
5. **表現余地とpreload reserveを別軸で判定する。** 高TBV側ではCO+6.9%に対しmean LAが約10.6→17.4 mmHg、LVEDPtmが約15.5→23.0となる。改善はしたがpressure costは残る。Tref+20%のCO+2.8%だけを収縮能不足とは判定しない（同時にEFは上がり、CVP/LA圧は下がるため、固定TBV・静脈還流による制約もある）。ただし幅広い症例表現を保証する証拠でもない。HR60の同条件ではRVEDVIが現在のrest gateを外れる点も残す。
6. **公開採用は観測定義・残るshape課題の判断後。** 最新互換Surface/analysisを継承し、定常checkpointと実ブラウザを検証する。短いAoP/PAPラベルを保ち、両者に同程度の第二層の位置・limitation説明を付ける。永久的なparameter範囲・基準・モデル変更は、ユーザー指定の外部1/2レビューを満たしてから行う。後負荷ストレス試験は再追加しない。

停止基準は、特定の「きれいなドーム」の再現ではない。観測定義・圧力仕事・保存則・時間刻み依存性が整合し、左右の圧/流れ/容積と既存preload応答について、既知の非生理的所見が解消または明示的に限定されていることを目指す。

## 主なコード確認箇所

- `studio/integrations/mainWireIntegratedV3/model-surface-workbench-analysis-v1.json`: AoP/PAPの現行binding。
- `studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v2.json`: 過去のAoP proximal-port binding。
- `studio/presentation/StudioItemPresentationCatalogV1.ts`: AoPの説明と、PAP summary説明の非対称性。
- `engine/valves/MainWireQuasiSteadyOrificeValveV2.ts`: 共通4弁構成式とhydraulic closure。
- `engine/valves/MainWireFourValveDiseaseResearchBracketsV1.ts`: 背景R・EOA・開閉parameter。
- `engine/myocardium/mechanics/normalAdultFiveWallPriorV1.ts`: LVFW/SEP/RVFWの共通materialと別の幾何。
- `engine/myocardium/experiments/MainWireBaselineReferenceResearchV1.ts`: 候補の共通心筋/Ca再構成。
- `engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1.ts`: Standard70の肺動脈近位Lの変更範囲。
- `engine/myocardium/MainWireIntegratedModelBeatMetricsV3.ts`: 正式なforward圧勾配積分定義。
