# Main-wire five-wall 固定全血液量比較 V1

## 結論

main-wire由来noncoronary sidecarに、初期total blood volume（TBV）を明示的な
operating-point ownerとして追加した。固定HR 60、`dt=2 ms`、最大32拍の一因子比較では、
controlとchallengerの両方が27拍目にformal period-1へ収束した。

challengerは心腔初期容積、血管PV則、unstressed volume、venous tone、抵抗、弁、Ca、
Land active-state subsystem、passive則、SLS、TriSegを変更していない。増加血液量だけを
SVとVCへ共通の初期transmural-pressure offsetとして配分した。parameter search、
PV形状fit、beat中のTBV projectionは行っていない。

この介入は、低かったCO、MAP、心腔容積、LA excursionを正常成人に近い作動域へ移した。
一方、LA PVは自己交差が1個から2個へ増え、単一のA/V lobeとして測定不能になった。
したがって、低いcold-seed TBVは重要な作動点問題だったが、TBV補正だけをcanonical化して
LA morphologyの解決とみなすことはできない。

## 固定した比較

| owner | control | challenger |
|---|---:|---:|
| 初期TBV | 4589.4576 mL | 5522.1100 mL |
| full-graph target | 5600 mL | 5600 mL |
| 除外coronary cold seed | 77.89 mL | 77.89 mL |
| SV/VC共通初期 $\Delta P_{tm}$ | 0 | 6.051930745 mmHg |
| SVへの追加量 | 0 | 695.540461 mL |
| VCへの追加量 | 0 | 237.111969 mL |

challenger targetは、まだ接続していないcoronary cold-seed volumeをfull-graph targetから
一度だけ除いた値である。

$$
V_{TBV,target}=5600-77.89=5522.11\ \mathrm{mL}.
$$

SVとVCの各PV lawを変更せず、両者へ同じpressure offset $\Delta P$を与え、

$$
\Delta V_{SV}(\Delta P)+\Delta V_{VC}(\Delta P)
=5522.11-4589.457569594
$$

を満たす一意なrootを二分法で解いた。これはparameter fittingではなく、固定TBV制約から
初期stateを構成する決定論的変換である。

## period-1 readback

| 指標 | control | challenger | 変化 |
|---|---:|---:|---:|
| formal convergence beat | 27 | 27 | 0 |
| CO | 3.852 L/min | 5.264 L/min | +36.7% |
| cardiac index | 2.027 | 2.771 L/min/m² | +36.7% |
| mean Ao pressure | 63.79 | 87.85 mmHg | +24.06 mmHg |
| LV EF | 60.74% | 58.03% | -2.71 points |
| LA min--max volume | 20.13--36.20 | 25.23--57.69 mL | excursion +101.9% |
| LA min--max pressure | 2.79--5.57 | 5.40--13.43 mmHg | 上方移動 |
| LV min--max volume | 41.50--105.70 | 63.47--151.21 mL | 上方移動 |
| MV peak E/A | 0.891 | 1.016 | +14.0% |
| PV S/D forward volume | 0.339 | 0.515 | +52.1% |
| reservoir-minus-conduit mean | 0.414 | 1.177 mmHg | +184.3% |

challengerではMV E/Aは分離し、A-onset時flow/E-peakは0.071だった。aggregate PV flowでは
Ar reverse volume 4.67 mLも生じた。これらはTBV作動点がdiastolic flow physiologyへ強く
影響することを示すが、形状acceptanceそのものではない。

## LA PV topology

- control：自己交差1、opposed lobe orientation、A/V面積
  7.52/3.44 mmHg mL。
- challenger：自己交差2で`multiple-self-intersections`。A/V面積は意図的にreadbackを
  withheldした。
- reservoirはconduitより上にある方向を両群で保った。ただしchallengerの等容量probeは
  101点中41点だけがunambiguousであり、branch-order 100%だけを単独の成功判定にしない。

TBV増加によりV-loop様の圧差とLA excursionは大きくなったが、同時にbooster領域と
conduit/reservoirの交差構造も変わった。したがってこの結果は、TBVを形状knobとして調整する
根拠ではなく、循環作動点と心房constitutive/activation構造を分離して検証する根拠である。

## claim boundaryと次段階

- current-dtのperiod-1同士なので形状比較は可能だが、`dt=1 ms`との整合性は未評価である。
- challengerを正常ヒトcanonical operating pointとはまだ主張しない。
- full main-wire coronary circulationを接続した後は、TBV targetとcoronary volumeを同じownerで
  再構成する。除外volumeを二重に足さない。
- common pericardiumはTBV/V-loop補正項としてではなく、effusion・tamponade・global capacityを
  表す独立した保存的外部constraintとして評価する。
- event-driven Caは正常HR60で旧periodic Caと解析的同値な状態空間実現から始め、TBV比較と
  同時にfitしない。

## 再現物

- paired comparison：
  `data/myocardium/reports/mainwire-normal-adult-five-wall-tbv-comparison-dt2ms-v1.json`
- control summary：
  `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-tbv-control-dt2ms-summary-v1.json`
- challenger summary：
  `data/myocardium/reports/mainwire-normal-adult-five-wall-periodic-tbv-challenger-dt2ms-summary-v1.json`
- control visual：
  `data/myocardium/visuals/mainwire-normal-adult-five-wall-tbv-control-dt2ms-v1.svg`
- challenger visual：
  `data/myocardium/visuals/mainwire-normal-adult-five-wall-tbv-challenger-dt2ms-v1.svg`

visualはraw accepted endpointsを直線で結び、smoothingとresamplingを行っていない。
