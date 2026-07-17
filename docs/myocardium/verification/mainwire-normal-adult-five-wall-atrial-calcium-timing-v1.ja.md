# Main-wire normal-adult five-wall atrial calcium timing comparison V1

## 結論

独立したhuman atrial calcium biomarker timingから固定した一つのchallengerは、現canonicalの
A-loop apexとV-loopを改善しなかった。`dt=2 ms`、HR 60、LA SLS on、canonical initialization、
最大32拍を固定し、両caseとも27拍目にperiod-1へ収束した。Ca drive以外のmechanics、循環graph、
循環runtime、periodic policyのcomponent hashとfull protocol identityは完全一致した。

challengerでは、

- V-loop面積: `3.435 -> 2.998 mmHg mL`（12.7%減少）
- A-loop面積: `7.517 -> 7.708 mmHg mL`（2.54%増加）
- A/V面積比: `2.188 -> 2.571`（17.5%増加）
- reservoir--conduit mean gap: `0.414 -> 0.362 mmHg`（12.6%減少）
- a-pressure peakまでに完了したbooster emptying: `43.4% -> 45.8%`
- atrial Ca onsetからa-pressure peak: `42 -> 48 ms`

となった。目的と逆方向なので、同じ仮説のparameter scanや`dt=1 ms`追試へ進めず、固定候補を
棄却する。これは「activationが一般に無関係」という結論ではない。今回比較した低次元の処方free-Ca
時間定数だけでは、現canonicalの主要blockerを所有しなかったという停止判断である。

## 介入の定義

canonicalは既存のLand atrial twitch output timingを再構成した低次元priorを使う。
challengerはMazhar et al. 2024（DOI `10.1113/JP283974`）がまとめたhuman atrial calcium
biomarkerの平均TTP `52.5 ms`、RT50 `177.5 ms`を、周期的に正規化したbiexponentialへ解析的に
写像した。

| property | canonical | challenger |
|---|---:|---:|
| atrial rise time constant | 12.5 ms | 19.5 ms |
| atrial decay time constant | 300 ms | 233 ms |
| constructed TTP | 40.98 ms | 52.50 ms |
| constructed RT50 | 208.20 ms | 177.55 ms |

変更したのはLAとRAが共有する処方free-Caのrise/decay time constantだけである。diastolic Ca、
peak amplitude、cycle length、AV delay、electrical-to-Ca delay、ventricular Ca、Land構成式、
Land state、$T_{ref}$、SLS、解剖、弁、血管、初期化、solverは変更していない。この比較は
Land crossbridge kineticsの比較ではなく、保存的なCa cycling modelでもない。digitized traceや
PV-loop shape fittingは用いていない。

Land et al. のhuman atrial mechanics model（DOI `10.1002/cnm.2931`）では、human atrial
twitch outputのTPT/RT50を約82/75 msへ合わせるため、Land parameterとCa waveformを一体として
調整している。これに対し本比較はLand parameterを固定し、独立Ca timingだけを反証する。このため、
上表のCa TTP/RT50をactive tension TPT/RT50と同一視しない。

## paired protocol boundary

比較器は次を満たさなければqualified metricを返さない。

- 両方がperiod-1でmorphology interpretation eligible
- `dt`、initialization、LA SLS mode、requested maximum beatsが一致
- Ca以外の4 component hashが完全一致
- full protocol identityからCa parameter set/hashだけを除いた値が一致
- drive ID、variant、parameter set、time constants、fixed-param hashがregistryと整合
- A/V lobeのactivation-dependent labelがsigned orientationを反転していない

今回のprotocol identity hashはcanonical `745d9200`、challenger `89da710a`で、Ca componentだけが
異なる。hashはcompact labelであって暗号学的provenanceではない。

LA PV lobeのA/V選択には処方Caから作るactivation burdenを使うため、この介入はlabel ownerにも
影響し得る。そこでselection evidence source、A/V activation burden、signed orientationを比較結果へ
明示し、orientationが反転したpairではA/V面積をqualified readbackにしない。今回は両caseとも
one crossing、opposed orientation、A-lobe正/V-lobe負を維持した。

## 生理readback

global hemodynamicsはほぼ不変で、CIは`2.027 -> 2.031 L/min/m2`、mean Ao pressureは
`63.79 -> 63.87 mmHg`であった。これは介入が循環全体を別のorbitへ移したための見かけ上の
V-loop差ではないことを支持する。

一方、MV A forward volumeは`11.24 -> 11.68 mL`、LA volume excursionは
`16.08 -> 16.27 mL`とわずかに増えたのに、pressure peakはより遅れ、peak前emptyingも増えた。
pressure peakとMV A-flow peakの差は両caseとも`2 ms`である。したがって現所見は、単純な
「A-flow peakだけがpressure peakより早い」問題ではなく、active pressureが立ち上がる間に
MVを介したemptyingが進む構造と整合する。

aggregate PV S/D forward-volume比は`0.3387 -> 0.3381`で実質不変、Ar reverse volumeは
`0.00073 -> 0 mL`であった。near-zero Arの相対変化は評価しない。若年正常では目立つArを欠く例や
S/D<1もあり得るため、Arを作るためだけのpressure/flow補正は導入しない。本sidecarのaggregate
`PVein_LA` edgeは4本の臨床Doppler計測でもない。

## 数理的な判断

LA血液量は

$$
\dot V_{LA}=Q_{PV}-Q_{MV}
$$

で決まる。今回Ca riseを遅くすると、LA active stressが十分に立ち上がる前の時間が延びた一方、
弁・循環側は同じであるため、圧peak前のnet emptyingが減らず、むしろ増えた。V-loop面積と
reservoir--conduit gapも同時に減った。この結果から、A apexを右へ移す目的でCa時定数をさらに
探索することは、独立データで定めた仮説をPV形状へ再fitする局所探索になる。

現periodic orbitは固定解剖priorより低い充満域にある。canonicalのLA orbitは
`20.13--36.20 mL`で、population-center anatomy priorの`35.72--80.18 mL`より小さい。
LV EDVも約`105.7 mL`でprior `144.4 mL`より小さい。EFは約0.607であるため、mean Ao pressureと
CIの低さを最初から高afterloadや収縮力不足へ帰属せず、TBV/unstressed volumeを含む閉ループ
volume partitionとmain-wire設定反映を次のownerとして調べる。

## 次の構造実験

次は二段階に分ける。

1. main-wire circulation configuration snapshotをpureにmaterializeし、node/edge override、
   supported valve parameter、PV law、呼吸外圧、TBV constructionをsidecar protocol identityへ
   明示的に取り込む。現canonical defaultはroundoff範囲で不変でなければならない。未接続の
   coronary、collapsible-tube $\chi$、変更されたlegacy valve $L/B$、非zero PV ostial inertanceを
   黙って無視せずfail closedにする。
2. snapshot parity後に、独立データで決めた一つのoperating-point ownerだけを固定比較する。
   anthropometric TBVまたはsystemic venous unstressed-volume offsetを同時には自由化しない。
   LA/LV volume envelope、fiber operating stretch、CI/MAP、V-loop、A apex、MV/PV flowを
   period-1で再評価する。

旧main-wireのchamber-valve `L/B`をそのまま戻すと、過去に約10--33 Hzのringingとclamp依存を
生じたため、dynamic valveを直ちに再導入しない。operating pointを確認した後も弁flow dynamicsが
必要なら、全4弁をenergy/power balanceと相補性を保つmonolithic stateとして独立に比較する。

## committed evidence

- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-canonical-dt2ms-summary-v1.json`
- `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-human-atrial-calcium-biomarker-dt2ms-summary-v1.json`
- `data/myocardium/reports/mainwire-normal-adult-five-wall-atrial-calcium-timing-comparison-dt2ms-v1.json`

raw周期runは大きく再生成可能なのでcommitしない。visual reviewはraw accepted endpointを直線で結び、
time-series smoothing、resampling、PV形状fitを行わない。
