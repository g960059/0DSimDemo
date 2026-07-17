# Main-wire normal-adult five-wall periodic verification V1

## 結論

PR #475 の最小 five-wall Land--TriSeg sidecar は、circulation configuration snapshot導入前の
同一protocol schemaで、固定parameterのまま`dt=2 ms`と`dt=1 ms`の双方で27拍目にperiod-1へ
収束した。2:1の同一時刻比較では8信号のfixed-scale最大差はすべて
`1.97e-2`未満で、LA V-loop面積は`3.435`から`3.380 mmHg mL`、reservoir--conduit mean gapは
`0.414`から`0.417 mmHg`であった。一方、A-loop面積は`7.517`から`8.284 mmHg mL`へ変わるため、
この一組だけを完全な時間刻み独立性、収束次数、または生理的合格gateとはしない。これらの
`dt=2 : 1 ms`数値はpre-snapshotのhistorical numerical baselineであり、現行7-component schemaの
qualified pairを主張しない。

同じpre-snapshot schemaでLA parallel SLSを厳密に切ると、`dt=2 ms`の同じperiodic条件でもLA PV loopは単一交点の
figure-eightから小さな追加交点を含む4交点となり、reservoir--conduitの等容量枝差も低下した。
したがって、現時点で1-state parallel SLSは削除しない。ただし、SLS offでも大域的な枝分離は残るため、
SLSをV-loopの唯一の生成機序とはしない。このablationは`dt=2 ms`だけの構造証拠であり、SLS効果の
時間刻みrobustnessまでは主張しない。

最初の`dt=1 ms`実行は第4拍で停止したが、failure ownerはLand length-factorのkinkを跨ぐ
mechanics有限差分Jacobian監査に局所化できた。nominal幅がhard symmetry gateを通らない場合だけ、
kinkを跨がない局所接線を得られるより小さなdyadic幅も固定順で監査するよう修正した。構成則branchを
ラベルで直接判定するのではなく、中心差分区間と局所対称性で判定する。物理式、parameter、Newton/対称性
tolerance、Land kink、時間積分、solver rescueは変更していない。修正後の`dt=1 ms`は上記の通り
period-1へ収束したため、pre-fix failureは現在のblockerではなく数値監査境界の履歴として残す。

## claim boundary

この検証は`MainWireNormalAdultFiveWallPeriodicSteadyV1` sidecarだけを対象とする。

- `ModelCore`またはbrowser-visible runtimeへの採用を主張しない。
- 冠循環は含まない。
- parameter search、PV形状へのlocal fitting、time-series smoothing/resamplingを行わない。
  `dt=2 ms : 1 ms`の波形差はfine側の同一時刻sampleを直接対応させ、時間補間しない。crossingと
  等容量枝比較だけはraw endpoint間のpiecewise-linear PV geometryを明示的に用いる。
- AVPD、LAA/body、pericardial state、追加Maxwell branchを加えない。
- morphologyは各`dt`でperiod-1収束した拍だけを解釈する。一つのreview pageはそのpageの`dt`における
  周期性だけを示し、時間刻みrobustnessは別のdt-halving比較からだけ判断する。
- aggregate `PVein_LA` flowを4本の臨床PV Doppler計測とは呼ばない。
- modeled VTIを臨床Doppler VTIのvalidationとは呼ばない。
- AoV閉鎖からMVOまでの固定asymptote fitを、同定済みの臨床tauとは呼ばない。
- `normal-adult`は固定prior/protocolの名称であり、現周期解が正常ヒトの運転点として
  validation済みであることを意味しない。

## historical fixed protocol（pre-snapshot）

| case | dt | LA SLS | initialization | max beats | 変更したもの |
|---|---:|---|---|---:|---|
| canonical | 2 ms | on | canonical | 32 | なし |
| basin audit | 2 ms | on | PVenからPVeinへ10 mL | 32 | 初期分布だけ。TBV差0 mL |
| material ablation | 2 ms | exact-off | canonical | 32 | LAのSLSだけを厳密に0 |
| dt-halving | 1 ms | on | canonical | 32 | dtだけ |

周期判定は68個のaccepted-state成分を、循環volume、dynamic flow、valve opening、TriSeg座標、
Land state、SLS viscous strain、wall input historyの7群へ分けて比較する。固定reference scaleで
正規化したperiod-1最大差が`1e-3`以下となる状態を3拍連続で要求する。period-2は独立に報告し、
period-1の代替として採用しない。通常のbeat iterationだけを用い、shooting、Anderson acceleration、
隠れたsubstep rescueは用いない。

pre-snapshot raw runは、mechanics provider、fixed Ca prior、noncoronary graph、circulation runtime、
periodic policyの5 componentを`protocolIdentityHash`に束ねていた。そのschema内ではdt比較と
initialization-basin比較にfull serialized identityの完全一致を要求し、canonical `dt=2 ms`と
`dt=1 ms`はmatched pairであった。旧identity hash `745d9200`はこのpre-snapshot schemaだけのlabelである。

現行schemaは上記5 componentにmain-wire circulation configuration snapshotとfixed initial
blood-volume priorを加えた7 componentである。
現canonical `dt=2 ms`は現行schemaで再生成され、snapshot materialization前のraw sampleとの数値parityを
確認した。TBV owner追加時には既存control summaryへ`cold-seed-control` identityだけを決定論的に
metadata migrationし、raw dynamicsを変更していない。一方、本書の`dt=1 ms`、SLS exact-off、
initialization-basin、dt-halving artifactsは現行schemaで再生成していない。このため、旧5-component
identityを現行identityと比較せず、現時点では
`dt=2 ms`と`dt=1 ms`の現行schema上のidentity一致も主張しない。現行identity/hashのsource of truthは
committed JSONであり、hashはcompact labelであって暗号学的provenanceではない。

compact summaryはpolicyそのものとclassifierが根拠にした3拍すべてのperiod-1/2 closureを保持する。

## canonical `dt=2 ms`

### 周期性と数値残差

- beat 25--27の3拍連続でperiod-1収束
- beat 27のperiod-1最大正規化差: `3.8387e-4`
- worst owner: `SEP.previousFiberLogStrain`
- period-2最大正規化差: `9.5507e-4`
- period-2 orbit判定: false
- cycle中のcirculation scaled residual最大: `1.9985e-10`
- continuity residual最大: `1.0693e-8 mL`
- TBV error最大: `9.09e-13 mL`

### hemodynamics

| metric | value |
|---|---:|
| LV EF | 0.6074 |
| RV EF | 0.5432 |
| aortic stroke volume | 64.20 mL |
| cardiac output | 3.852 L/min |
| cardiac index (BSA 1.9 m2) | 2.027 L/min/m2 |
| mean absolute Ao pressure | 63.79 mmHg |
| LA volume range | 20.13--36.20 mL |
| LA transmural pressure range | 2.79--5.57 mmHg |
| LV volume range | 41.50--105.70 mL |
| LV transmural pressure range | 1.65--88.10 mmHg |

平均Ao圧63.79 mmHg、CI 2.027 L/min/m2、後述のD優位PV flowを含むため、この表は
固定protocolの読み出しであって正常成人human envelopeのacceptance表ではない。

### LA PV morphology

- true crossing: 1
- A-loop area: `7.517 mmHg mL`
- V-loop area: `3.435 mmHg mL`
- A/V area ratio: `2.188`
- lobe orientation: opposed
- reservoirがconduitより上にある利用可能な等容量probe: 97/97。全requestedで101点中4点は曖昧/利用不可
- reservoir minus conduit: mean `0.414`、median `0.314 mmHg`

V-loopはゼロではなく、単一交点を持つfigure-eightとして成立した。ただしA-loopはV-loopの約2.2倍で、
A-pressure peakまでにbooster emptyingの43.4%が終了している。lobe選択に使う`activation01`は
処方free-Caを0--1正規化した診断proxyであり、Landの活性テンションやcrossbridge状態そのものではない。
したがって、利用者が指摘した
「A-loop apexが左へ寄る」傾向は残る。pressure peakはatrial Ca onsetから42 ms後で、A-flow peakとの
差は2 msに過ぎない。現在の問題はpressure peakとA-flow peakの相互遅延というより、active pressureが
立ち上がる間にMVを介したemptyingが既に進むことにある。

V-loop面積の正常ヒトtargetはこのartifactだけでは確立していないため、`3.435 mmHg mL`を生理的振幅の
合格gateとはしない。atrial Ca onset時のMV flowはE peakの23.3%であり、E/Aは完全には静止していないが、旧モデルで問題に
なった強い融合状態より小さい。A apexだけを右へ動かすためにactivation、MV resistance、passive stressを
同時調整してはならない。

### pressure wavesとflow ledger

| metric | value |
|---|---:|
| MV E peak / A peak | 212.95 / 238.92 mL/s |
| peak E/A | 0.891 |
| MV E / A forward volume | 52.65 / 11.24 mL |
| E/A wave separation | separated; valley 49.61 mL/s; valley/lower peak 0.233 |
| MVO / MVC / atrial Ca onset phase | 0.370 / 0.958 / 0.854 |
| a / x / v / y | 4.823 / 3.250 / 5.521 / 2.792 mmHg |
| x descent / y descent | 1.574 / 2.729 mmHg |
| AVC--MVO interval | 154 ms |
| report-only LV relaxation tau | 40.5 ms (`R2=0.938`) |
| aggregate PV S / D forward volume | 15.35 / 45.33 mL |
| aggregate PV Ar reverse volume | 0.00073 mL |

MVO/MVCはleaflet contactや圧交差を直接観測した時刻ではなく、最大forward flowの1%を用いた
flow-threshold transitionである。MVCはatrial Ca onset以後に最初に起きるclosure transitionを採るため、
E-wave終了点と同一視しない。E/Aの`separated`はE-window peakとA-window peakの間に厳密なforward-flow
valleyがあるという波形診断であり、弁閉鎖を要求しない。このため、イベント位相とE/A分離を独立に読む。

aggregate PV flowはD優位で、Ar reversalがほぼない。したがって、LA PV loopが改善したことをもって
正常なpulmonary venous physiologyが完成したとはしない。右心・肺循環、弁、呼吸を含むmain-wire
runtime統合後に再検証する必要がある。`dt=1 ms`でもAr reverse volumeは`0.0270 mL`に留まり、
絶対量はS/D forward volumeに対して極小である。near-zero量の相対変化を改善とは解釈しない。

### SLS energy ownership

canonical LA SLSでは、1拍あたり

- physical dissipation: `0.3584 mJ`
- backward-Euler numerical dissipation: `0.02985 mJ`
- stored-energy change: `5.5e-6 mJ`
- reconstructed discrete balance residual: rounding level

であった。SLS散逸の92.3%はphysical termで、BE numerical termの約12倍である。これはSLS効果が
単なる時間離散化損失だけでないことを支持する。Land active stressには熱力学的stored energyのclaimを
置かない。

圧・容量の空洞workは正の`p dV`をwallへの仕事とし、`1 mmHg mL = 0.133322 mJ`で変換する。
stress workは正の`tau de`をwallへの仕事とする。両者のendpoint quadrature差を含むwhole-heart
conjugacy residualは`dt=2 : 1 ms`で`4.349 : 2.184 mJ`、LAで`0.0416 : 0.0217 mJ`へ約半減した。
現時点でworkは所有・符号・散逸の診断であり、この残差にformal acceptance gateを設けない。

## historical LA-SLS exact-off control（pre-snapshot identity schema）

exact-offもbeat 27でperiod-1へ収束したので、transient同士の形状比較ではない。

| metric | SLS on | exact-off |
|---|---:|---:|
| true crossing count | 1 | 4 |
| two-lobe measurement | measurable | not measurable |
| reservoir-conduit mean gap | 0.414 | 0.274 mmHg |
| reservoir-conduit median gap | 0.314 | 0.169 mmHg |
| LA SLS physical dissipation | 0.358 | 0 mJ |
| cardiac output | 3.852 | 3.854 L/min |

exact-offでmean branch gapは33.7%低下し、PV pathは複数の小交点を持ってone-crossing criterionを
満たさなくなった。一方、COはほぼ不変で、大域的なreservoir--conduit順序は残った。したがってSLSは
V-loopの唯一の生成機序ではないが、LA wall historyの独立ownerとして`dt=2 ms`での枝分離と
piecewise-linear topologyへ寄与している。この固定ablationは`E_v`または`tau_v`の最適化ではなく、
dt refinement前にtopology robustnessを一般化しない。

## historical initialization-basin audit（pre-snapshot identity schema）

canonicalと、PVenからPVeinへ10 mLだけ移した初期条件は、いずれもbeat 27でperiod-1へ収束した。
最終拍を同じaccepted indexで比較した最大fixed-scale差は、8信号すべてで`1.70e-6`以下であった。
LA volumeの最大物理差は`2.47e-5 mL`、MV flowは`3.97e-4 mL/s`である。

この比較器自体は閾値を設定せず「同じ軌道」と自動判定しない。ただし、少なくとも今回の固定10 mL
再分配に対して、報告された周期波形が実用上無視できない初期値依存を示す証拠はない。

## historical dt-halving evidence（pre-snapshot identity schema）

同じ旧5-component schema内で、修正後の`dt=1 ms`もbeat 25--27の3拍連続でperiod-1へ収束した。

- beat 27のperiod-1最大正規化差: `3.6457e-4`
- worst owner: `SEP.previousFiberLogStrain`
- period-2最大正規化差: `9.0463e-4`
- cycle中のcirculation scaled residual最大: `1.9924e-10`
- continuity residual最大: `1.2386e-8 mL`
- TBV error最大: `1.82e-12 mL`

最終拍のaccepted sampleは、mechanics Jacobian監査で実際に使った有限差分幅を保持する。
nominal幅は`2e-5`である。classifier根拠のbeat 25--27では、`dt=2 ms`は各500/500 step、
`dt=1 ms`は各1000/1000 stepがすべてnominal幅で、alternateは0回であった。したがって報告対象の
periodic morphology自体はfallback幅に依存していない。runnerは最終3拍だけを保持するため、初期過渡の
alternate総回数はこのartifactからは算出しない。旧failure点の局所replayでは`1e-5`幅がhard gateを
通過し、前後stepはnominalを保った。幅readbackはsolverへのfeedbackしない。

coarseの各accepted sampleをfineの2 sampleごとの同一時刻endpointへ直接対応させた。時間補間はなく、
比較器はpass/fail thresholdも収束次数も設定しない。

| signal | max physical difference | fixed-scale max | relative L2 |
|---|---:|---:|---:|
| LA volume | 0.2664 mL | 0.00266 | 0.00291 |
| LV volume | 0.3269 mL | 0.00218 | 0.00146 |
| LAP | 0.0914 mmHg | 0.00914 | 0.00871 |
| LVP | 1.6700 mmHg | 0.01670 | 0.00689 |
| MV flow | 8.6768 mL/s | 0.01735 | 0.02116 |
| aggregate PV flow | 3.6220 mL/s | 0.00724 | 0.01413 |
| LA total wall stress | 79.82 Pa | 0.00080 | 0.01048 |
| LA fiber log strain | 0.001961 | 0.01961 | 0.01135 |

両`dt`でone true crossing、opposed lobe、reservoir-above-conduitを利用可能な97/97 probeで保った
（各requested 101点中4点は曖昧/利用不可）。`dt=2 : 1 ms`で
V-loop面積は`3.435 : 3.380 mmHg mL`（fineで1.6%低下）、mean branch gapは
`0.414 : 0.417 mmHg`である。これに対しA-loop面積は`7.517 : 8.284 mmHg mL`（fineで10.2%増加）で、
A/Vは`2.188 : 2.451`となる。したがって旧schema内ではV-loopと枝順序はこのrefinementで
定性的・定量的に近いが、A-loop面積は同じ程度には収束していない。単一の2:1 pairから漸近収束域や
次数を推定せず、この数値を現行7-component schemaのqualified comparisonへ読み替えない。

### pre-fix `dt=1 ms` failureの所有者

履歴として、修正前の`dt=1 ms`はbeat 4、phase 0.419、time 3.419 sで停止した。

- failure reason: `line-search-failed`
- failure前にaccepted Newton steps: 22
- accumulated line-search backtracks: 223
- 最終line-search候補: callback exception 25、Armijo residual rejection 0
- final scaled residual infinity norm: `3.0653e-5`
- final maximum continuity residual: `0.001561 mL`
- worst independent continuity owner: LV
- TBV error: `9.09e-13 mL`

failure候補はすべてmechanics callbackで棄却され、Armijo条件そのものに落ちた候補はなかった。
last exceptionは、SEP stretchがLand length factorのkink `lambda=0.87`直上にある状態で、nominal central
difference幅がkinkを跨いだgeneralized-force Jacobian symmetry auditであった。relative antisymmetryは
`0.0002000000031`で固定gate `0.0002`を極微小に超えたが、same-branchに留まる小さいFD幅では
antisymmetryは`1e-11`程度、symmetric-part minimum eigenvalueは約0.146であった。

修正はnominal幅を必ず最初に監査し、それが不成立のときだけ`0.5, 0.25, 0.125, 2, 4, 8`倍の
固定優先順位で同じhard gateを最初に満たすJacobianを採用する。constitutive branch自体のラベル判定は行わず、
小さな中心差分区間がkinkを跨がないことと局所対称性を診断根拠とする。constitutive residual floorに対する従来のlarge-step
候補も保持した。これはLand kinkを平滑化せず、symmetry tolerance、constitutive law、solver residual
tolerance、parameter、accepted-state更新、time stepを変えない監査幅の選択である。修正後の成功により、
pre-fix failureを物理不安定性または現在のdt-halving blockerとは解釈しない。
このhistorical raw/summaryは`protocolIdentityHash`とaccepted-step差分幅readbackの導入前に生成されたため、
現runとの波形比較には用いず、pre-fix failure ownerの記録に限定する。

## 現時点の設計判断

1. PR #475のcore mechanicsと1-state parallel SLSを保持する。
2. 新しいmaterial state、AVPD state、LAA compartment、追加Maxwell branchを足さない。
3. pre-snapshotの`dt=2 : 1 ms`差をhistorical numerical baselineとして保持するが、現行schemaの
   qualified pairとはせず、formal pass gateや収束次数を後付けしない。
4. SLS exact-offの意味は`dt=2 ms`固定ablationに限定し、V-loopの唯一のownerとはしない。
5. 独立human atrial Ca timingに基づく固定challengerを一回だけ比較する。その結果は
   `mainwire-normal-adult-five-wall-atrial-calcium-timing-v1.ja.md`へ分離する。
6. activation challengerは棄却した。main-wire circulation configuration snapshotを追加し、default raw sample
   parityを確認した。詳細は`mainwire-normal-adult-circulation-configuration-snapshot-v1.ja.md`に置く。
7. snapshotで現cold TBV `4589.458 mL`がofficial full-graph target `5600 mL`を採用していないことを
   確認した。`5600 - excluded coronary cold seed 77.89 = 5522.11 mL`だけを固定比較し、
   systemic venous $V_u$を同時に変更しなかった。両caseはperiod-1へ収束したが、challengerは
   自己交差が2個となったため、TBV ownerは採用してもchallenger形状をcanonicalとはしない。
8. main-wire runtime、冠循環、弁、呼吸へ接続した後、PV S/D/Ar、LA volume envelope、A apexを再評価する。

## committed evidence

現行7-component schemaのcontrol identityへmetadata migration済み（raw dynamicsは未変更）:

- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-canonical-dt2ms-summary-v1.json`

現行7-component schemaで固定TBV pairを再生成済み:

- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-tbv-control-dt2ms-summary-v1.json`
- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-tbv-challenger-dt2ms-summary-v1.json`
- `data/myocardium/reports/mainwire-normal-adult-five-wall-tbv-comparison-dt2ms-v1.json`

以下はpre-snapshot historical schemaの数値証拠であり、現行`dt=2 ms`とのprotocol identity一致を
主張する資料ではない:

- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-canonical-dt1ms-summary-v1.json`
- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-la-sls-exact-off-dt2ms-summary-v1.json`
- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-initialization-basin-dt2ms-v1.json`
- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-pre-same-branch-fix-dt1ms-failure-summary-v1.json`
- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-dt-halving-v1.json`

raw full-cycle JSONは再生成可能で大きいためcommitしない。review HTML/SVGはraw accepted samplesから
生成し、time-series smoothing/resampling、phase-shape fittingを行わない。crossingと等容量枝probeは
raw endpoint間のpiecewise-linear geometryを用いる。このgeometry補間と、dt-halving波形比較で禁止した
時間補間を混同しない。
