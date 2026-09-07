# 半月弁・肺動脈負荷の切り分け — 2026-09-06

## 結論

現候補のPV背景抵抗はRV–PA勾配の有意な寄与因子だが、RVの圧ピークが駆出後半にあることの単独原因ではない。除去すると勾配は下がる一方、圧ピークはさらに遅くなる。PA/PArt compliance振幅を変更しても、この時相は大きく変わらない。したがって、Rをゼロにしたりcomplianceを再fittingしたりすることを、RV形状の解決として採用しない。

公開baseline、modelID、gate、Surface、Ca/Landは変更していない。追加コードは研究用の抵抗・肺動脈complianceの限定的な比較経路と回帰テストである。外部レビューは[別紙](REVIEW-DECISION.md)。

## 実験の範囲

- 基準は既に資格確認された `vascular-center-R1.04` 候補。HR70、TBV5250、BSA1.9。
- Ca、Land、心室壁構成、EOA、弁開閉時定数、静脈tone、血管抵抗、近位Lを固定。
- AV背景RとPV背景Rの2×2比較。R=0は原因切り分けの端点であり、正常値の新しいpriorではない。
- 別に、元の弁Rを保ったPA/PArt compliance振幅×0.75、×1.5を比較。Ao/SA/ArtのPV構成則全体、全静脈の構成則、Vuは不変。
- afterload stress testや新しいCa/Land探索は実施していない。
- 既存の周期性判定が3周期連続で成立した時点で停止。許容差変更なし。研究laneは4プロセス・lean実行、終端でfull-invariant再現を照合。

研究入力の同定は元候補のIDだけで済ませず、実runtime全体・血行動態入力・dt・jobを含むconstruction SHA-256を使用。checkpointはこのSHA付き研究envelopeの中でのみ再開可能とした。元候補から介入条件への引き継ぎはintentional warm startであり、異なる構成へのexact restoreと偽らない。

## 6条件の結果（2 ms）

| 条件 | AV平均/最大勾配 mmHg | PV平均/最大勾配 mmHg | AV/PV ET ms | RVPピーク時相* | PAP最大/最小 mmHg | CI L/min/m² |
|---|---:|---:|---:|---:|---:|---:|
| 基準 | 4.478 / 8.440 | 4.612 / 7.726 | 270 / 274 | 69.4% | 30.39 / 14.13 | 3.210 |
| AV R=0 | 4.021 / 7.793 | 4.612 / 7.720 | 270 / 274 | 69.4% | 30.38 / 14.12 | 3.211 |
| PV R=0 | 4.480 / 8.407 | 3.221 / 6.014 | 270 / 270 | 72.7% | 30.63 / 14.18 | 3.220 |
| 両弁 R=0 | 4.017 / 7.752 | 3.222 / 6.008 | 270 / 270 | 72.7% | 30.61 / 14.16 | 3.220 |
| PA/PArt C×0.75 | 4.494 / 8.473 | 4.481 / 7.364 | 270 / 278 | 68.6% | 31.86 / 13.51 | 3.211 |
| PA/PArt C×1.5 | 4.459 / 8.410 | 4.816 / 8.069 | 270 / 266 | 68.5% | 28.12 / 15.12 | 3.199 |

*既存のshape診断が用いるthresholded forward-flow区間内の最初の最大圧の経過時間比。解剖学的な弁開閉時相そのものではなく、新しい正常域gateでもない。

六条件はすべて周期定常に到達。全体wall timeは17.92秒（このマシン・warm start・4並列での観測値）。必要周期数は順に3、5、10、13、18、20。

PV R除去による平均勾配の変化は−1.390 mmHg。AV R除去とのdifference-of-differencesは−0.000072 mmHgで、この作動点ではPV勾配への交互作用は小さい。これは広いenvelopeでの独立性を証明しない。

圧流量仕事 `Σ Q_k (P_up,k−P_down,k) Δt_k` も確認した。PVでは基準465.12→PV R=0で332.19 mmHg·mL/周期。基準で線形項が担う仕事は156.58 mmHg·mL。除去後には流量自体も変わるので、仕事低下量は単純な線形項引き算とは一致しない。仕事/SVによる流量加重勾配は、臨床の時間平均勾配とは区別して記録した。

LV ICT/IRT/Teiは条件間で約63–65 ms / 96 ms / 0.589–0.597、MV flow E/Aは0.908–0.942。RV ICT/IRT/Teiは28–30 ms / 64–68 ms / 0.336–0.361、TV flow E/Aは1.095–1.108。これらは原因比較の補助記録で、独立した収縮力の証明ではない。

既存診断では、全条件のLVP/RVPは有意ピーク1個、late PV chord deficitと駆出内の最大後ピークreboundは0。PAPも有意ピーク1個。閉鎖後reboundはC×0.75で0.0114 mmHg、他の2 ms条件では0であり、厳密な単調減衰とは言い切らないが、既存の0.5 mmHg基準を十分下回る。ただし、この有限個の診断だけで全波形の生理的妥当性を証明したとはしない。

C×1.5のPAP最小値15.118 mmHgは既存resting-reference checkの上限15を超えた。介入条件の結果としてそのまま残し、gateを変更していない。

![Accepted-step comparisons](contrasts.png)

図は実際のaccepted endpointsを直接結んだもの。平滑化なし。RVP/PAPは同じ圧軸。RV PV loopはtransmural pressure、時間波形はintracavitary/node pressureを使用。四条件の目視でも、新たな二峰性は見られないが、RVピークを早期化する変化ではない。

## 1 msでの再確認

基準と両弁R=0のみを細かい刻みで確認。2 msもsolver統計を追加して再実行した。

| 1 ms条件 | AV平均/最大勾配 | PV平均/最大勾配 | AV/PV ET | LVP/RVPピーク時相 | LV +dP/dt / −dP/dt |
|---|---:|---:|---:|---:|---:|
| 基準 | 4.540 / 8.480 | 4.679 / 7.794 | 268 / 271 ms | 76.2% / 69.4% | 2766 / −1676 mmHg/s |
| 両弁R=0 | 4.107 / 7.811 | 3.278 / 6.088 | 267 / 267 ms | 77.0% / 72.7% | 2785 / −1679 mmHg/s |

2→1 msの差は、平均勾配で最大0.090 mmHg（約2.19%）、最大勾配で最大0.080 mmHg（約1.31%）、ETで最大3 ms、LV圧微分で最大約1.93%、RV圧微分で最大約3.30%。RVPピーク時相の遅延方向は同じ。1 ms基準のPAP閉鎖後reboundは0.00174 mmHg、両弁R=0では0。この確認は今回の差を読み取るための刻み感度確認であり、連続時間解への厳密な収束証明ではない。

両弁R=0のNewton反復は定常化中の最大7、最終周期は2/1 msとも最大6。最終周期のbacktrack合計は2/0で、全ステップ受理。R=0のゼロ勾配近傍では流量接線に特異性があるため、数値上の注意点は残るが、今回の結論を無効化する反復破綻は認めなかった。

4回の刻み確認でTBV誤差は最大2.73e−12 mL、冠循環volume ledger残差は最大1.05e−12 mL。これは実装の体積保存に関する検証であって、生理全体または全エネルギー保存の検証ではない。

## 圧回復・Zcに関する判断

現在の比較はZc・圧回復なし。AV/PVは同じ型の代数流量＋opening-memory弁で、表示AoP/PAPはいずれもcompliance-node pressureである。「AoPだけZcを足しているから差が小さい」という現在モデルに対する説明は採らない。

独立レビューの一方にあった「PVでは回復で9割以上の圧差が消える」という推定は、そのまま採用できない。今回想定する、流速を無視した心室内圧から回復後の静圧への関係では、`r=EOA/A_downstream` とすると、単純な急拡大モデルの不可逆損失比は `(1−r)²`、下流の運動エネルギー水頭比は `r²`。したがって静圧差比は `(1−r)²+r²`、vena contractaからの静圧回復比は `2r(1−r)` である。`2r−r²` は総水頭の不可逆損失の減少割合であり、同じ意味ではない。

Reilらの肺動脈homograft研究でも、PRIは `2(r−r²)` であり、Pnetとenergy lossは区別されている。これはnative PVの直接検証ではない。[Reil 2022](https://physoc.onlinelibrary.wiley.com/doi/10.14814/phy2.15432)

肺動脈のZcは正常心肺疾患なしのカテーテル対象10例で20±1 dyn·s/cm⁵と報告され、約0.015 mmHg·s/mLに相当する。ただし母集団・測定条件を持つ参照値で、固定の正常priorではない。現候補のPA_PArt抵抗は0.00625なので、ここから0.015だけを単純に切り出すと残余抵抗が負になる。ZcはPAPの見た目に加算すれば済むものではなく、分岐と直流抵抗配分を含むモデル上の設計が必要。[Murgo & Westerhof 1984](https://scholars.uthscsa.edu/en/publications/input-impedance-of-the-pulmonary-arterial-system-in-normal-man-ef/)

過去の回復profileの丸ごと移植も行わない。それは回復とZcに加え、L、compliance、Vuを同時に変えるため、今回の原因切り分けにはならない。

## 次に行う最小の実験

1. 現候補を保持し、AVだけの **recovery-only** 比較を1条件実施する。既存の3 cm下流径を研究上の仮定と明示し、静圧差を扱う上記の式を使用。背景R、Ca/Land、compliance、L=0を固定し、Zc=0のままにする。旧profileは流用せず、弁以外を変えない。
2. これで局所の勾配と波形への効果を分ける。弁開閉時定数を変えなくても、駆動圧が変わればopeningの軌道は変わり得る点を含め、EOA・Q・圧・時相を記録する。
3. Zcの比較は別因子にする。総抵抗だけでなく、冠循環分岐がどの圧を参照するかも保存・明示する。波形が好ましい方向へ動くと先に決めつけない。
4. native PVへの圧回復転用は、下流断面と測定位置を決めてから行う。LVとRVの輪郭を同じにすることは目標にしない。

今回の範囲ではR×Cの追加交差条件やR=0.3探索を増やす根拠は弱く、実施しない。他弁や心筋の再fittingも保留する。将来の公開採択は、その時点の数理・生理的な根拠、現在Surfaceの継承、必要なbaseline再資格確認、指定の外部1/2レビューを別に満たす必要がある。

## 検証・再現情報

- 焦点を絞った4テストファイル計110 tests passed（新規17、baseline-reference56、non-coronary35、production rounded-ejection2）。型検査成功、git diff --check成功。
- 全10 runでcheckpoint roundtrip、異なるR/C構成のrestore拒否、lean/full replay一致を確認。基準unit profileは変更前候補の1周期traceと完全一致。
- 数値集計：[study-summary.json](study-summary.json)。実行コード：[run-study.ts](run-study.ts)。図・集計：[analyze-study.mjs](analyze-study.mjs)。実行条件：[protocol.md](protocol.md)。
- coarse-v2とquality-v1で実行時のsource hashが異なるため、変更前のrunner・protocol・vascular coreを `snapshots/` に保存。記録済みSHAに18項目すべて一致することを集計スクリプトで検証した。
- 実行後のコードでは、肺動脈compliance入力のexplicit nullをさらに拒否する境界チェックとproduction assemblyで研究入力が不在であるテストを追加。許可された数値の演算は不変。実行当時のソースを新しいhashで上書きしていない。
- 初回coarse-v1のC×0.75は周期定常には到達したが、旧入力表現ではcheckpointのglobal stiffness boundに抵触した。失敗を隠さず保存し、公開範囲を広げずに、同じ構成則を肺動脈専用の研究入力で表現し直してcoarse-v2で再確認した。
