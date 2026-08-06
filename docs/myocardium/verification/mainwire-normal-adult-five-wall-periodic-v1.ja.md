# Main-wire normal-adult five-wall periodic verification V1

## 結論

PR #475 の最小 five-wall Land--TriSeg sidecar は、固定parameterのまま`dt=2 ms`と`dt=1 ms`の
双方で27拍目にperiod-1へ収束した。2:1の同一時刻比較では8信号のfixed-scale最大差はすべて
`1.97e-2`未満で、LA V-loop面積は`3.435`から`3.380 mmHg mL`、reservoir--conduit mean gapは
`0.414`から`0.417 mmHg`であった。一方、A-loop面積は`7.517`から`8.284 mmHg mL`へ変わるため、
この一組だけを完全な時間刻み独立性、収束次数、または生理的合格gateとはしない。

LA parallel SLSを厳密に切ると、`dt=2 ms`の同じperiodic条件でもLA PV loopは単一交点の
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

## 2026-07-17 fixed-TBV operating-point owner更新

現行canonical runnerは、topology cold seedから暗黙に得られる`4589.457569594 mL`を
正常成人の運転点として採用しない。full graphのreference `5600 mL`から、現noncoronary scopeに
含まれない冠循環cold-seed ledger `77.89 mL`を明示的に除いた

$$
5600-77.89=5522.11\ \mathrm{mL}
$$

を、一つの固定TBV ownerとしてcanonical initializationに与える。`5600 mL`をnoncoronary TBVと
読み替えない。追加volumeはmain-wire由来の現SV/VC PV lawを固定したまま、SVとVCの初期transmural
pressureへ同じoffsetを加えることで決定し、それ以外のcold-seed node、venous tone、$V_u$、compliance、
resistance、弁、Ca、Land、SLS、geometryは変更しない。resolved offset、root iteration、volume auditは
決定論的readbackでありprotocol hashへ入れず、次の5 fieldだけをsemantic owner identityとする。

- `ownerId`
- `parameterSetId`
- `topologyScopeId`
- `fixedTotalBloodVolumeMl`
- `initialDistributionPolicyId`

periodic protocolはこのowner identityを独立componentとしてhashする。同じprovider、circulation
topology/runtime、common pericardium、periodic policyで、overall identityは導入前`f715dacc`から
導入後`9d3d3dba`へ意図的に変化し、ownerの異なるwarm startは拒否する。owner component hashは
`337d28cc`である。構築auditはperiodic resultへunhashed readbackとして残す。以下の周期波形・PV形状・
hemodynamicsの数値表は旧`4589.457569594 mL` ownerで生成したhistorical evidenceであり、新ownerの
生理的結果へ読み替えない。新しい運転点での周期解は別artifactとして再生成・再評価する必要がある。

除外冠循環volumeはauthoritative full graphと共通cold-seed volume則から再導出し、`77.89 mL`との
一致をdrift gateとする。SV/VC resolved volumeを再度PV inverseへ通したpressure-offset residualも
unhashed auditへ保存する。warm-start envelope schemaは`2`へ更新し、checkpoint内の固定TBV ownerが
source/target protocol identityのTBVとbit-exactに一致しないpayloadを、再fingerprint済みでも拒否する。
旧schema `1`との後方互換性は意図的に持たない。

## 2026-07-17 fixed-TBV / shared-circulation 再検証

上記ownerを実際に用い、循環graph、PV law、pressure source、edge lossをmain-wireと共通kernelへ集約した
実装を、parameter searchなしで再検証した。健康caseの`dt=2 ms`と`dt=1 ms`は、同じ収束済み
`dt=4 ms` cycle-boundary checkpointから直接分岐し、互いをwarm-startには用いていない。両runの
`maximumBeatCount=32`、initialization label、full protocol identityは同一である。

| case | dt | initialization | termination | completed beats | morphologyの扱い |
|---|---:|---|---|---:|---|
| healthy H2 | 2 ms | 同一S0 warm-start | period-1 | 8 | 採用可能 |
| healthy H1 | 1 ms | 同一S0 warm-start | period-1 | 10 | 採用可能 |
| effusion E2 | 2 ms | 同一S0 warm-start | max 32 beats | 32 | 記述のみ |
| effusion E1 | 1 ms | 同一S0 warm-start | max 32 beats | 32 | 記述のみ |
| LA SLS exact-off A2 | 2 ms | canonical cold | period-1 | 27 | topology gateなし |

健康H2/H1のdt-halving比較は`interpretable=true`で、全23 signalを同一accepted時刻で比較できた。
bulk hemodynamicsは安定している。

| metric | H2 2 ms | H1 1 ms |
|---|---:|---:|
| LVEF | 0.5802 | 0.5808 |
| RVEF | 0.5428 | 0.5435 |
| aortic SV | 87.736 mL | 87.803 mL |
| cardiac output | 5.264 L/min | 5.268 L/min |
| mean absolute Ao pressure | 87.858 mmHg | 87.931 mmHg |
| LA volume range | 25.23--57.69 mL | 25.11--57.40 mL |
| LA pressure range | 5.40--13.43 mmHg | 5.36--13.54 mmHg |
| conduit emptying | 8.403 mL | 8.323 mL |
| booster emptying | 24.053 mL | 23.960 mL |
| reservoir--conduit mean gap | 1.177 mmHg | 1.139 mmHg |

利用可能な等容量probeでは両dtともreservoirがconduitより上にある割合が`1.0`で、重複volume幅も
`18.04 : 17.99 mL`であった。したがって、以前問題だった「y trough後も圧が回復せず、後半conduitが
前半より下へ落ちる」現象は現runにはない。`dt=1 ms`ではconduit volume反転はphase
`0.546--0.547`に起き、aggregate PV inflowがMV outflowを上回るflow crossoverが直接ownerである。
反転直後25 msの`+0.598 mL, +0.123 mmHg`は、主にpassive reload `+0.166 mmHg`、次いで
SLS recovery `+0.047 mmHg`から生じ、Landは`-0.028 mmHg`でまだ弛緩方向にある。LV suctionを
独立したLA pressure sourceとして加えなくても、pressure gradient、MV flow、LA volumeを介して
期待した右上向き回復が生じた。

同様に、a-peakからMVCまでのlate booster pathは`V=40.277→25.121 mL`、
`P=13.539→11.677 mmHg`で左下へ進む。圧差分のexact midpoint product分解は、geometry
`+4.313`、passive stress `-5.798`、Land `+0.425`、SLS `-0.802 mmHg`である。したがって、
左下向き下降は主にpassive unloadingがgeometry増幅と残存active contributionを上回ることで成立し、
SLSは補助的である。旧Hill CE--SEEで問題になったような、収縮末期を左上へ曲げる独立$F_v$項はない。

ただし、LA PV raw pathにはH2/H1とも自己交差が2個残る。H1の交点は
`(49.168 mL, 8.814 mmHg)`と`(49.417 mL, 7.456 mmHg)`であり、既存のone-crossing
two-lobe診断は`multiple-self-intersections`として不採用になる。この2交点は`dt=4, 2, 1 ms`で
残り、SLS exact-off A2でも2個である。したがって、これは時間刻みartifactでも、現在のparallel SLS
だけのparameter不足でもない。H1の圧assembly residualは`7.1e-15 mmHg`以下、continuity residualは
`7.2e-9 mL`以下であり、残差による偽交差とも説明できない。

交点をbranchへ戻すと、上側はphase `0.3347`のreservoirと`0.8679`のearly pumping、下側は
phase `0.4640`のearly conduitと`0.8631`のlate-refill/very-early pumping移行部である。下側の
後者はCa onset後なのでevent owner上はpumpingだが、幾何学的にはlate conduit refillが最大volumeで
booster emptyingへ反転する瞬間である。同じvolumeでのpassive pressure差は両交点とも
`4e-6 mmHg`未満で、上側ではLand `+0.18338`とSLS `-0.18338 mmHg`、下側ではLand
`+0.00776`とSLS `-0.00777 mmHg`がほぼ相殺してtotal pressureを一致させる。

機序的には、自己相似one-fiber LAでは、低activation期の圧はほぼ

$$
P_{LA}^{tm}=G(V_{LA})
\left[\sigma_{passive}(e(V_{LA}))+\sigma_{Land}+\sigma_{SLS}\right]
$$

であり、Land/SLS contributionが小さいearly fillingとlate diastasisでは、同じvolumeがほぼ同じ
passive $P(V)$へ戻る。そのため、MV runoffで左下へ進む前半conduitと、PV refillingで右上へ戻る
後半refill-to-booster移行部が近いpassive branchを逆向きに通り、履歴成分が相殺する点で下側の追加交差を
作る。SLS exact-offの再実行でもtrajectoryを変えた上で2交点が残るため、このexact cancellationをもって
SLSだけをtopology ownerとはしない。これは「conduitの後半が右上へ回復する」という局所的な生理条件と、
「全周期pathが一交点だけ」という大域topology条件が、現在の一自由度geometryでは同時に満たされて
いないことを意味する。

この結果から、次の変更をLand/SLSの局所parameter tuningにはしない。必要なら次段では、volumeだけで
駆動する受動shape stateを再導入するのではなく、独立に計測可能なannular/longitudinal boundaryまたは
心房shape coordinateを持つwork-conjugate membrane構造を比較対象にする。その候補は

$$
P_{LA}^{tm}=\frac{\partial\Psi_A(V,q,\xi)}{\partial V},
\qquad
\eta_q\dot q+\frac{\partial\Psi_A(V,q,\xi)}{\partial q}=Q_q^{boundary}
$$

とし、$q$の仕事を$P\,dV$へ重複計上せず、$Q_q^{boundary}$を波形fit用の処方forcingにしない。
AVPDをprescribed core driverにはせず、導入する場合もこの境界運動から計算されるobservableとする。
過去に棄却したvolume-only aspect-ratio stateや、boundへ衝突したshared long-axis prototypeをそのまま
復活させない。弁・肺静脈boundaryのmain-wire統合を先に固定し、その後に同一envelopeで反証する。

300 mL effusion positive controlは、両dtの全sampleで心膜constraintがengageし、`dt=1 ms`で
`Pperi=3.507--11.832 mmHg`、stored energy `10.315--64.910 mJ`、CO `2.583 L/min`を示した。
数値failureはないが、事前に固定した32拍でperiod-1 toleranceを3拍連続では満たさなかったため、
effusionのPV topologyとdt-halving signal差は採択しない。追加beatやcase別parameter変更で救済せず、
この未収束をload-envelope blockerとして残す。

LA SLS exact-off A2は27拍でperiod-1へ収束し、LA SLS stress、stored energy、physical dissipation、
BE numerical dissipation、balance residualはすべて厳密に0である。CO `5.272 L/min`、mean Ao pressure
`87.97 mmHg`、reservoir--conduit mean gap `1.093 mmHg`で、自己交差はonと同じ2個であった。
この結果はSLSを削除する判断ではなく、SLS-offにもone-crossing topologyを要求しないという事前境界と、
現追加交差の主要ownerがSLSではないという反証を支持する。

この再検証にもparameter search、morphology fit、時間補間、収束次数claim、post-hoc pass thresholdはない。
健康caseのdt差で最も敏感なのはvalve opening transitionで、bulk volume/pressureより先に弁の構造・数値境界を
再検討する根拠になる。

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

## 固定protocol

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

各raw runは、mechanics providerのparameter/solver identity、fixed Ca prior、main-wire由来のnoncoronary
graph、circulation runtime、periodic policyのstable hashを`protocolIdentityHash`に束ねる。hashはcompact labelであり、
dt比較とinitialization-basin比較はhashに加えてfull serialized identityの完全一致も必須とする。
欠落または不一致時は`uninterpretable`とする。
compact summaryはpolicyそのものとclassifierが根拠にした3拍すべてのperiod-1/2 closureを保持する。
canonical `dt=2 ms`と`dt=1 ms`のmatched protocol identityは`745d9200`で、5つのcomponent hashと
full serialized identityも一致した。このhashはcompact labelであり、単独で暗号学的provenanceを主張しない。

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

## LA-SLS exact-off control

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

## initialization-basin audit

canonicalと、PVenからPVeinへ10 mLだけ移した初期条件は、いずれもbeat 27でperiod-1へ収束した。
最終拍を同じaccepted indexで比較した最大fixed-scale差は、8信号すべてで`1.70e-6`以下であった。
LA volumeの最大物理差は`2.47e-5 mL`、MV flowは`3.97e-4 mL/s`である。

この比較器自体は閾値を設定せず「同じ軌道」と自動判定しない。ただし、少なくとも今回の固定10 mL
再分配に対して、報告された周期波形が実用上無視できない初期値依存を示す証拠はない。

## dt-halving evidence

修正後の`dt=1 ms`もbeat 25--27の3拍連続でperiod-1へ収束した。

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
A/Vは`2.188 : 2.451`となる。したがってV-loopと枝順序はこのrefinementで定性的・定量的に近いが、
A-loop面積は同じ程度には収束していない。単一の2:1 pairから漸近収束域や次数を推定しない。

## 現時点の設計判断

1. PR #475のcore mechanicsと1-state parallel SLSを保持する。
2. 新しいmaterial state、AVPD state、LAA compartment、追加Maxwell branchを足さない。
3. `dt=2 : 1 ms`の差を数値baselineとして保持するが、単一pairへformal pass gateや収束次数を後付けしない。
4. SLS exact-offの意味は`dt=2 ms`固定ablationに限定し、V-loopの唯一のownerとはしない。
5. A apexの左寄りとA-loopのdt差が残るため、shape fittingではなく、独立したatrial Ca/force-rise dataに基づく
   atrial activation kineticsを一つの構造仮説として比較する。
6. main-wire runtime、冠循環、弁、呼吸へ接続した後、PV S/D/Ar、LA volume envelope、A apexを再評価する。

## committed evidence

- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-canonical-dt2ms-summary-v1.json`
- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-canonical-dt1ms-summary-v1.json`
- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-la-sls-exact-off-dt2ms-summary-v1.json`
- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-initialization-basin-dt2ms-v1.json`
- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-dt-halving-v1.json`

raw full-cycle JSONは再生成可能で大きいためcommitしない。review HTML/SVGはraw accepted samplesから
生成し、time-series smoothing/resampling、phase-shape fittingを行わない。crossingと等容量枝probeは
raw endpoint間のpiecewise-linear geometryを用いる。このgeometry補間と、dt-halving波形比較で禁止した
時間補間を混同しない。
