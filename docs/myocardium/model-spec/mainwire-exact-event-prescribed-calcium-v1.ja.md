# Main-wire exact-event prescribed calcium V1

## 目的

このV1は、現在の固定HR 60周期biexponential free-Ca waveformを、任意のevent列で駆動できる
最小状態空間へ厳密に写像する。正常周期波形を再fitせず、不規則RR、欠落拍、PAC/PVC、
壁別activation時刻を将来扱える入力境界を作る。

このkernelはcalcium-handling modelではない。SR load、RyR recovery、SERCA、restitution、
force-frequency relation、post-extrasystolic potentiation、Ca alternansを予測しない。Land 2017の
full active-state subsystemへ処方cytosolic free Caを渡し、passive則は別ownerとする。

## 最小状態

壁ごとに2状態だけを持つ。

$$
\dot r=-\frac{r}{\tau_r},
\qquad
\dot d=-\frac{d}{\tau_d},
\qquad
0<\tau_r<\tau_d.
$$

event $k$の強度を$s_k\ge0$とすると、event時に、

$$
r^+=r^-+s_k,
\qquad
d^+=d^-+s_k.
$$

出力は、

$$
[Ca]_{free}=C_{rest}+\beta(d-r).
$$

両状態へ同じjumpを加えるため、$d-r$とfree Caはevent時に連続である。event間は解析解、

$$
r(t+\Delta t)=r(t)e^{-\Delta t/\tau_r},
\qquad
d(t+\Delta t)=d(t)e^{-\Delta t/\tau_d}
$$

で進め、Ca kernel自体に時間刻み誤差を導入しない。同時eventは強度を決定論的に加算する。

## 現periodic priorからの解析変換

reference cycleを$T$、単位event直後のperiodic steady stateを$(R,D)$とすると、

$$
R=\frac{1}{1-e^{-T/\tau_r}},
\qquad
D=\frac{1}{1-e^{-T/\tau_d}}.
$$

$$
g(t)=D e^{-t/\tau_d}-R e^{-t/\tau_r}.
$$

旧waveformの周期谷を$C_{trough}$、peak-minus-troughを$\Delta C$とし、$g$の最大時刻を
$t_p$とすると、

$$
\beta=\frac{\Delta C}{g(t_p)-g(0)},
\qquad
C_{rest}=C_{trough}-\beta g(0).
$$

ここで旧`diastolicCalciumUM`は周期定常状態の谷$C_{trough}$であり、長い無刺激後に近づく
$C_{rest}$ではない。この区別により、欠落拍でCaを人為的に周期谷へresetせず、残存Caを自然に
持ち越せる。

現固定priorから得たevent-free asymptoteは、

| prior | $C_{rest}$ |
|---|---:|
| baseline atrial | 0.077712 µM |
| ventricular | 0.109395 µM |

である。これは新しいfit値ではなく、旧周期波形を完全保存する解析変換の結果である。

reference cycleを10000分割して旧評価関数と比較した最大絶対差は、baseline atrial
`1.11e-16 µM`、ventricular `2.22e-16 µM`だった。

## transactionへの将来統合

kernelとevent schedulerを分離する。

- scheduler：electrical event、壁別delay、AV timing、event acceptance/strengthを所有する。
- kernel：accepted event列から2状態を厳密に進め、free Caを返す。
- Land active-state subsystem：free Ca、fiber strain、strain rateからactive stressを返す。
- passive/SLS：Land activeとは別の保存・散逸ownerとする。

閉ループ統合時は10個のCa state（5壁×2）をcirculation・mechanicsと同じatomic accepted stateへ入れ、
step失敗時に一括rollbackする。formal period-1 closureにも全Ca stateを含める。off-grid eventでは、
nominal grid boundaryとnext eventの早い方で区間を切る。

初手ではrefractory state、resource state、SR/RyR/SERCA stateを足さない。独立した不整脈dataで
fixed event strength/時定数の限界が示された場合にだけ、event-strength ownerへ最小recovery stateを
追加する。

## 文献境界

- Land et al. 2017は、CaTRPN、B、W、S、$\zeta_w$、$\zeta_s$のactive stateを持ち、
  cytosolic Ca transientを入力とする。<https://pubmed.ncbi.nlm.nih.gov/28392437/>
- prescribed biexponential Caをcrossbridge kineticsの入力に使う先例はある。
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC8635462/>
- Ca alternansやrelease recoveryは固定振幅のevent重畳だけでは表せない。
  <https://pubmed.ncbi.nlm.nih.gov/16946134/>

したがってclaimは「exact event timing and linear superpositionを持つphenomenological
electrical-event-to-free-Ca boundary」に限定する。
