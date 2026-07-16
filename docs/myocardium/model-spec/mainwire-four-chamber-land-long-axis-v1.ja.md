# Main-wire four-chamber Land–TriSeg–long-axis V1 設計境界

## 状態

この文書は、main wire の循環graphへ四心腔力学を接続するための設計仕様である。
現時点では段階実装中であり、browser runtime置換、正常ヒト較正、症例fitを主張しない。

目的は特定のLA PV形状を直接fitすることではない。正常域を含む広い負荷域で、reservoir、
conduit、booster pumpを同じ物理stateから生じさせ、将来は各parameterを独立計測へ対応づける。

## 陰性だった構造を本体へ積層しない

簡略循環sidecarの固定比較では、次の変更はV-loopを意味のある程度には拡大しなかった。

- LA bodyとLAAの代数的common-pressure並列化
- common pericardial pressureの追加
- 一状態Maxwell springの有限ひずみ非線形化
- LA volumeだけで駆動される受動isochoric aspect-ratio state

これらをV-loop修正要素として新しい本体へ積層しない。LAAは血栓・stasis・LAA interventionを
扱う段階で独立した流体・壁ownerとして再検討できるが、正常V-loopを作るための補正項にはしない。
心膜はmain wireが既に持つ外部負荷として維持するが、V-loop面積のownerとはみなさない。

受動shapeを動作点で線形化すると、

$$
\Psi(e,s)
=
\frac12K_{ee}e^2+K_{es}es+\frac12K_{ss}s^2,
$$

$$
\eta_s\dot s+K_{ss}s+K_{es}e=0,
\qquad
Q_e=K_{ee}e+K_{es}s,
$$

したがって、

$$
Q_e(p)
=
\left[K_{ee}-\frac{K_{es}^2}{K_{ss}+\eta_s p}\right]e(p).
$$

これはvolume入力しか持たない一極SLSであり、独立したLV–LA work pathではない。

## 単一の循環owner

血管・血液量・flowのownerは `ModelCore` main wire graphとする。

- 4心腔
- Ao–SA–Art–Cap–SV–VC
- PA–PArt–PCap–PVen–PVein
- LAD、LCx、RCA、coronary sinus
- 動脈指数型PV law
- collapse/open/distendedを連続化した静脈PV law
- Pth、Palv、waterfall、心筋内冠血管外圧
- graph incidenceによる血液量balance

四心腔力学側には独自の4血管compartment、独自TBV、独自肺静脈complianceを持たせない。
通常のaccepted transactionではincidence balanceをmass ownerとし、TBV projectionは安全監査で
ゼロであることを要求する。

## 四心腔力学provider

循環graphはaccepted chamber blood volumeを四心腔力学providerへ渡す。providerは一つの
transactionとして次を所有する。

- LA、RA：Land active + equilibrium passive + 必要最小限のparallel Maxwell
- LV、RV、septum：Land active + equilibrium passive + parallel Maxwell + TriSeg
- 横方向ひずみを解析的に消去したreduced one-fiber isochoric long-axis座標
- 四心腔transmural pressure
- pure trial、明示commit、cold initialization、parameter identity

per-chamber providerが共有可変stateを参照する構造は禁止する。TriSegとlong-axisは四心腔を横断する
ため、一つのproviderが一貫したcandidateを評価する。

## 共有reduced isochoric long-axis座標

初手は左心系に無次元の準静的座標 $q_L$ を一つ置く。$q_L>0$をLA effective longitudinal
fiber lengtheningとLV shorteningの向きとする。

$$
e^*_{LA}=e^0_{LA}+a_{LA}q_L,
\qquad
e^*_{LVFW}=e^0_{LVFW}+a_{LV}q_L,
\qquad
e^*_{S}=e^0_S+a_Sq_L,
$$

固定したreduced priorは、

$$
a_{LA}>0,
\qquad
a_{LV}<0,
\qquad
a_S<0.
$$

各$a_w$は、横方向ひずみを解析的に消去したone-fiber isochoric modeの係数であり、scalar
volumetric strainではない。現段階では完全なtensor basisを実装・主張しない。したがって、

$$
\Delta V_{LA}^{q}=\Delta V_{LV}^{q}=0.
$$

旧式の $\widetilde V_{LA}=V_{LA}-A_Mz$ は用いない。

準静的平衡はvirtual workから、

$$
G_q
=
\sum_{w\in\{LA,LVFW,S\}}
V_{w}a_w\sigma_w
=0
$$

とする。$sigma_w$と$V_w$は、effective fiber log strainと仕事共役なstress-volume measure
（たとえばcoaxial incompressible reductionでのCauchy stressとcurrent load-bearing wall volume）
としてconstitutive ownerが一組で供給する。active、equilibrium passive、Maxwellのstressは同じ
effective strainを入力として評価する。
このため、

$$
\sum_w V_w\sigma_w\dot e_w^*
=
\sum_wV_w\sigma_w\dot e_w^0+G_q\dot q
$$

が成り立つ。LV active/relaxation workをLAへ一方向forcingせず、同じvirtual-work pairで反力を返す。
初手ではdashpot、慣性、時定数を足さない。$q$がboundへ張り付く、または総接線が負になる場合、
parameter調整で救済せず構造failとする。

## 弁

弁はmain wireのparameter namespaceを唯一のownerとする。

$$
A(\xi)=A_{leak}+\xi(A_{max}-A_{leak}),
$$

$$
R(A)=R_{open}\left(\frac{A_{ref}}{A}\right)^2,
\quad
B(A)=B_{open}\left(\frac{A_{ref}}{A}\right)^2,
$$

$$
L=L_{open}+L_{root}.
$$

$L(A)$を採用するには、流体運動エネルギー$L(\xi)q^2/2$とleafletへの相反generalized forceが
必要になる。初手ではそのstateを増やさず、main wireと同じ一定inertanceを用いる。

$q$と$\xi$を独立stateとし、accepted-state backward Euler residualを用いる。
$A_{leak}$は病的な双方向regurgitant orificeである。数値area floorとは別parameterにする。

- $A_{leak}=0$：完全閉鎖時の持続逆流をゼロにする
- $A_{leak}=0$：半滑らかな片側制約$q\ge 0$とし、圧逆転後の正方向coastingは慣性式に残す
- $A_{leak}>0$：病的逆流として双方向flowを許す
- 固定reverse-flow capや$q$/$\dot q$ clampを形状調整には使わない

## 固定比較と停止規則

詳細parameter fittingの前に、次だけを固定比較する。

1. main wire circulation + joint four-chamber mechanics、$q_L$ off
2. 同一条件、$q_L$ on

atrial SLS、弁parameter、血管parameterは同じ固定priorに保つ。初回は$q_L$以外をfactorにしない。

評価はLA/LV PV、LAP/LVP、MVF、PVFだけでなく、

- $G_q$とwall別virtual work
- reservoirとconduitの同一volume圧差
- x、v、y timingと振幅
- LV EF、EDPVR、relaxation
- qのbound hit、総接線、root uniqueness
- graph mass ledger、通常時TBV projection量
- valve pressure-flow/opening residual、片側projection、離散energy balance

を含める。

$q_L$ onがV-loopの因果方向を改善しない、または追加damping/gainなしでは成立しない場合、
そこで停止する。さらにshape stateを追加して救済しない。

## 生理学的根拠と限界

LA reservoirはLA relaxationだけでなくLV systolic long-axis shortening/base descentに依存することが
実験的に示されている（Barbier et al., 1999, DOI 10.1161/01.CIR.100.4.427）。LA conduitは
left-heart constant-volume状態からの逸脱とLV early fillingに依存する
（Bowman and Kovacs, 2004, DOI 10.1152/ajpheart.00969.2003）。詳細whole-heart
electromechanicsは分布変形と閉ループ循環から生理的なatrial figure-eight PV loopを再現している
（Fedele et al., 2023, DOI 10.1016/j.cma.2023.115983）。

一方、明示AVPD stateなしのsarcomere-based closed-loop modelでもfigure-eight loopは生成可能である
（Pironet et al., 2013, DOI 10.1371/journal.pone.0065146）。したがって$q_L$はV-loopの数学的必要条件
とは主張しない。現モデルで欠けている、画像で同定可能なLV–LA mechanical work pathの最小仮説として
falsifyする。
