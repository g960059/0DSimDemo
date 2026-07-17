# Main-wire normal-adult circulation configuration snapshot V1

## 結論

このV1は循環の数値構成を変えず、five-wall sidecarがmain-wireから何を採用し、何を除外し、
どの初期blood-volume ledgerで開始しているかを一つのdeep-frozen snapshotへ固定する。

default parityでは、snapshot導入前後の`dt=10 ms`、1拍の全accepted raw sampleが完全一致する。
既存topology/runtime hashもそれぞれ`27a8ce3f` / `6a2d35d3`のままである。変化するのは、
新しいconfiguration payloadを含むoverall protocol identityだけである。

同時に、現sidecarがmain-wire公式`active-normal` baselineのTBV `5600 mL`を採用せず、
topologyのcold seedから暗黙に得た`4589.458 mL`で走っていることが判明した。除外した冠床の
cold seed volumeは`77.89 mL`である。したがって次の独立した構造仮説は、

$$
5600-77.89=5522.11\ \mathrm{mL}
$$

をnoncoronary固定TBV候補として比較することである。ただしこれは厳密な「scope-corrected正常TBV」
ではなく、`official target minus excluded coronary cold seed`という構成上の候補である。

## snapshotの所有境界

sourceは次である。

- topology: `buildNodes()` / `buildEdges()`
- runtime scalar: `defaultParams()`
- official operating point source: `OFFICIAL_BASELINES["active-normal"]`
- noncoronary graph: 15 node / 15 edge

effective sidecarは次を使用する。

- vascular PV runtime: venous tone、arterial stiffness
- losses: systemic / pulmonary resistance multiplier
- external pressure: fixed PEEP / Pth0、呼吸振幅0
- arterial-root dynamic flow: `Ao_SA`、`PA_PArt`
- valve: leaflet-opening fractionのみをmemoryとするquasi-steady complementarity orifice
- pulmonary-vein ostium: zero-inertance resistive `PVein_LA`
- dependent TBV node: `SV`
- fixed backward-Euler/Newton policy

4弁について、sourceの`Aref/Amax/Aleak/kOpen/tauOpen/tauClose/R/L/B`を記録する。
effective snapshotにはsolverへ渡すquasi-steady valve parameter object全体、MV deadband、
numerical area floor、opening-drive smoothing、quadratic-flow smoothingをそのまま格納する。
sourceの`L/B`はprovenanceとして残すが、effective valve flow memoryやBernoulli係数のownerではない。

## 明示的な除外

- coronary node/edgeとそのblood volume
- collapsible-tube $\chi$ correction
- nonzero respiratory oscillation
- dynamic valve flow memoryとsource valve inertance
- nonzero pulmonary-vein ostial inertance

pericardial constraintはcirculation configurationではなくfive-wall mechanics protocol側の境界であり、
このsnapshotのsource/effective比較には含めない。

main-wire defaultではcoronaryがenabledだが、このsidecarはnoncoronaryである。V1はこの差を
`sourceEnabled=true / effectiveIncluded=false`として記録する。冠循環parameterを変更した入力は、
除外領域の変更を黙って無視しないようfail closedにする。

## override policy

このV1はbaseline snapshotであり、一般的なconfiguration adapterではない。

- non-empty `nodeOverrides`は拒否
- non-empty `edgeOverrides`は拒否
- top-level valve scalarがtopologyと異なれば拒否
- valve `L/B`がsource topologyと異なれば拒否
- `useChiResistance=true`は拒否
- nonzero respiratory amplitudeは拒否
- nonzero bleed/fluid、`projectTBV=false`は拒否
- excluded coronary controlの変更は拒否

一方、venous tone、arterial stiffness、systemic/pulmonary resistance、PEEP、Pth0はresolverが
effective runtimeへmaterializeできる。ただしcanonical periodic protocolは固定registry snapshotとの
完全一致を要求する。将来overrideを正式にsupportするときは、snapshotを記録するだけでなく、
resolved graphをinitializationと全Newton trialの唯一の入力にし、accepted stateにもconfiguration identityを
持たせる必要がある。

## initial volume ledger

現cold seedの内訳は次である。

| compartment | volume (mL) |
|---|---:|
| four chambers | 370.000 |
| systemic arterial + capillary | 1039.336 |
| systemic venous | 2568.776 |
| pulmonary arterial | 80.337 |
| pulmonary venous | 531.009 |
| total | 4589.458 |

official full-graph targetとの差をsystemic venous unstressed volumeの変更へ直ちに帰属しない。
同じstressed-volume変化をTBV追加と$V_u$低下の両方で作れるため、両者を同時に自由化すると
識別不能になる。次はTBVだけを変更し、$V_u$、tone、compliance、resistance、弁、Ca、Land、SLS、
geometryを固定する。

## protocol integrity

periodic protocol identityは次を別々にhashする。

- mechanics provider metadata
- fixed Ca prior
- circulation topology
- circulation runtime
- full circulation configuration snapshot
- periodic policy

summaryとreviewはpayload、component hash、embedded hash、overall identity hashを再検証する。
snapshotが欠落・malformed・固定registry外なら、shape/physiology readbackを生成せずdomain errorで停止する。

## 次の比較

controlは`4589.457569594 mL`、challengerは`5522.11 mL`とする。追加volumeはinitialization時に
systemic venous `SV/VC`へ、両者のtransmural pressureへ同じoffsetを加えるよう配分する。
これはTBVという一つのownerを変えるための初期state constructionであり、venous toneや$V_u$は変えない。

判定はV-loop最大化ではなく、period-1、mass/continuity、LA/LV volume envelope、CI/MAP、
filling pressure、one-crossing/opposed lobes、reservoir--conduit orderを同時に読む。V-loop面積、
A apex、MV/PV flowは下流readbackとして報告し、個別shape gateにはしない。
