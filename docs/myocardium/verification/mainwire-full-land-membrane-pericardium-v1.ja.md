# Main-wire Land active-state membrane-TriSeg + common pericardium V1

## 判定

研究sidecarへ、状態を増やさない保存的common-bag pericardiumを採用する。

- 5壁はLand 2017の6-state active-myofilament subsystemを使う。受動則とparallel SLSは
  Landとは別ownerである。
- LV--septum--RVはenergy-conjugate membrane TriSegとし、独立bending stateを足さない。
- 心膜は全4心腔血液容積、5壁材料容積、静的心嚢液の総占有容積から一つの保存energyを評価する。
- 同じ$P_{peri}=d\Psi_{peri}/dV_{occ}$を4腔のabsolute pressureへ一度だけ加える。
  TriSeg内部座標へ別の心膜forceを加えない。
- normal baselineは同じ式のzero branchに置く。心膜で低いMAPやPV形状を補正しない。
- 症例表現はeffusion、tamponade、global cardiac-capacity constraintまでとする。scalar bagは
  regional adhesion、局所心膜炎、呼吸性ventricular discordance、収縮性心膜炎一般を表さない。

現段階ではbrowser-visible `ModelCore` runtime置換、正常成人較正、患者fit、冠循環統合を主張しない。

## 数理構造

$$
V_h
=V_{LA}+V_{LV}+V_{RA}+V_{RV}+\sum_{w=1}^{5}V_{wall,w},
$$

$$
V_{occ}=V_h+V_{fluid}.
$$

$V_{fluid}$は静的占有量で、TBVへ加えず新しいdynamic stateにもならない。smooth positive part
$\langle\cdot\rangle_{+,C^2}$を用い、

$$
x=\frac{V_{occ}-V_{h0}}{V_{h0}},
\qquad
u=\langle x\rangle_{+,C^2},
$$

$$
\Psi_{peri}
=P_{offset}V_{occ}
+\frac{P_0V_{h0}}{k}\left(e^{ku}-1-ku\right),
$$

$$
P_{peri}=\frac{\partial\Psi_{peri}}{\partial V_{occ}},
\qquad
K_{peri}=\frac{\partial P_{peri}}{\partial V_{occ}}\ge0.
$$

V1では$P_0=500$ Pa、$k=8$、$P_{offset}=0$を固定する。clinical effusionはoffset pressureではなく
$V_{fluid}$が所有する。`prescribedPressureOffsetPa`はuniform external-pressure test境界であり、
effusion parameterとして使わない。

各心腔容積に対する共通圧Jacobianは、

$$
J_{peri}=K_{peri}\mathbf 1\mathbf 1^T
$$

のrank-one positive-semidefinite項となる。総容積を変えない心腔間redistribution方向はnullspaceに
入り、common pressureはchamber-to-chamber pressure differenceを直接変更しない。

## phase-consistent normal reference

旧referenceはatrial maximumとventricular EDVを異なる時相から同時加算していたため採用しない。
現V1は同一時相候補を比較する。

$$
V_{h,ED}=V_{LA,min}+V_{RA,min}+V_{LV,EDV}+V_{RV,EDV}+\sum_wV_{wall,w},
$$

$$
V_{h,ES}=V_{LA,max}+V_{RA,max}+V_{LV,ESV}+V_{RV,ESV}+\sum_wV_{wall,w},
$$

$$
V_{h0}=1.05\max(V_{h,ED},V_{h,ES})
=600.126542735\ \mathrm{mL}.
$$

5%はhealthy slackを作るV1 model priorであり、正常ヒト定数またはfit済み値ではない。

固定caseは次の3つだけで、任意CLI parameter scanは公開しない。

| case | $V_{h0}$ | $V_{fluid}$ | 用途 |
|---|---:|---:|---|
| healthy-slack | 600.1265 mL | 0 | normal zero-branch |
| global-capacity positive control | 430 mL | 0 | common-capacity mechanism |
| effusion positive control | 600.1265 mL | 300 mL | fluid-occupancy/tamponade mechanism |

## 周期解とcontinuation

固定HR 60で、4 msのperiod-1 checkpointから2、1 msへ同じaccepted-state全体をcontinuationした。
各runは固定groupwise tolerance $10^{-3}$を3拍連続で満たすまで通常のbeat iterationを続ける。

| arm | dt | initialization | final branch beats | termination |
|---|---:|---|---:|---|
| healthy | 4 ms | cycle-boundary warm start | 3 | period-1 converged |
| healthy | 2 ms | 4 ms checkpoint | 7 | period-1 converged |
| healthy | 1 ms | 2 ms checkpoint | 6 | period-1 converged |
| global-capacity | 4 ms | common-pericardium-only continuation | 7 | period-1 converged |
| effusion | 4 ms | common-pericardium-only continuation | 25 | period-1 converged |

checkpointはcirculation、mechanics、Land/SLS/valve memory、TriSeg座標とprotocol identityを照合する。
心膜caseだけを変更するbranchは`common-pericardium-only`と明示する。

## healthy readback

1 msのhealthy terminal beatでは、

| 指標 | 値 |
|---|---:|
| LA volume | 19.991--36.064 mL |
| LV volume | 41.363--105.579 mL |
| RA volume | 27.843--45.360 mL |
| RV volume | 54.460--118.614 mL |
| MAP | 63.826 mmHg |
| CO / CI | 3.853 L/min / 2.028 L/min/m² |
| LV / RV EF | 0.6082 / 0.5409 |
| maximum TBV error | $1.82\times10^{-12}$ mL |
| maximum continuity residual | $1.22\times10^{-8}$ mL |

$V_h$は358.596--472.615 mLで、全1000 sampleの$P_{peri}$、$K_{peri}$、$\Psi_{peri}$はexact zeroだった。
正常orbitを心膜で形状修正していない。

LA PVは自己交差1個とopposed orientationを持つ。4、2、1 msのA/V lobe面積は、

| dt | A lobe | V lobe | reservoir-minus-conduit mean |
|---:|---:|---:|---:|
| 4 ms | 6.314 | 3.548 mmHg mL | 0.405 mmHg |
| 2 ms | 7.516 | 3.434 mmHg mL | 0.414 mmHg |
| 1 ms | 8.283 | 3.380 mmHg mL | 0.417 mmHg |

V-lobe topologyとbranch orderはこの範囲で安定したが、A-lobe面積は1 msまでdt不変ではない。
dt-halving比較はdifference reportであり、収束次数またはformal numerical pass gateではない。

## fixed positive controls

| 指標 | global-capacity | effusion 300 mL |
|---|---:|---:|
| engaged samples / 250 | 94 | 250 |
| $P_{peri}$ range | 0--2.629 mmHg | 1.854--7.167 mmHg |
| peak stored energy | 4.564 mJ | 31.599 mJ |
| heart-volume range | 355.034--458.557 mL | 330.261--380.279 mL |
| occupied-volume range | 同上 | 630.261--680.279 mL |
| CO | 3.655 L/min | 2.042 L/min |
| MAP | 61.129 mmHg | 38.888 mmHg |
| maximum TBV error | $1.82\times10^{-12}$ mL | $1.82\times10^{-12}$ mL |

effusionで$V_{occ}-V_h=300$ mLを保持し、この300 mLを血液量へ加えていない。全sampleで
$P_{peri}\ge0$、$K_{peri}\ge0$、$\Psi_{peri}\ge0$である。

一周期の保存・離散work ledgerは、

$$
0.625426=0.005188+0.620238\ \mathrm{mJ}
$$

（global-capacity）、

$$
0.974437=0.006541+0.967896\ \mathrm{mJ}
$$

（effusion）となった。左辺はbagへの圧力仕事、右辺は保存energy変化とBackward Euler remainderである。

positive controlはlawとtransactionを作動させる反証試験であり、患者parameterまたは正常値ではない。
特にeffusion 300 mLは強いtamponade-like負荷となるため、その出力を臨床severity calibrationに使わない。

## 自動検証

- $d\Psi/dV=P$、$dP/dV=K$、$K\ge0$
- smooth engagementの非負・単調・convex性
- $J_{peri}=K\mathbf1\mathbf1^T$とzero-sum redistribution nullspace
- 4腔への共通圧加算とtransmural/absolute pressure分解
- fluid volumeとTBVの所有分離
- exact-off、atomic rollback、protocol identity、warm-start checkpoint
- current implementationに対する10 test files、48 tests

## claim boundaryと次段階

- common pericardiumはV-loop ownerではない。normal branchがzeroであることを要求する。
- 次は固定TBV owner、event-driven Ca、common pericardiumを一つずつ統合し、同時fitしない。
- full main-wire coronary/vascular runtimeへ接続後、TBV target、PVR、RV loadingを再評価する。
- regional constrictive physiologyがproduct requirementになった場合だけ、独立画像・呼吸dataに基づく
  uncoupled/regional surface constraintを別layerとして検討する。

## evidence

- `data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/periodic-summary-dt4ms.json`
- `data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/periodic-summary-dt2ms.json`
- `data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/periodic-summary-dt1ms.json`
- `data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/periodic-summary-global-capacity-dt4ms.json`
- `data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/periodic-summary-effusion-dt4ms.json`
- `data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/dt4ms-to-dt2ms.json`
- `data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/dt2ms-to-dt1ms.json`
- `data/myocardium/visuals/mainwire-full-land-membrane-pericardium-v1-dt1ms.html`
- `data/myocardium/visuals/mainwire-full-land-membrane-pericardium-v1-dt1ms.svg`

visualはraw accepted endpointを直線で結び、time-series smoothing、resampling、PV形状fitを行わない。
