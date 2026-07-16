# Main-wire four-chamber Land–TriSeg V1 設計境界（long-axis陰性記録を含む）

## 状態

この文書は、main wire の循環graphへ四心腔力学を接続するための設計仕様である。
現時点では段階実装中であり、browser runtime置換、正常ヒト較正、症例fitを主張しない。

目的は特定のLA PV形状を直接fitすることではない。正常域を含む広い負荷域で、reservoir、
conduit、booster pumpを同じ物理stateから生じさせ、将来は各parameterを独立計測へ対応づける。

## 2026-07-16 構造判定

固定HR 60、`dt=2 ms`、main-wire noncoronary循環、同一Ca priorでの反証試験から、canonical
構造を次のように更新した。

- shared long-axis $q_L$：棄却。onでは第1心拍52 msで$|q_L|=0.1$の宣言boundへ到達した。
  gain、bound、spring、dashpot、慣性を追加して救済しない。
- LAA+body、common pericardial constraint：追加しない。過去の固定比較でV-loop拡大を所有しなかった。
- 弁：chamber間の独立flow inertanceを棄却し、EOA由来Bernoulli損失を持つ準定常orificeへ簡約した。
  Ao/PA rootと血管edgeのinertanceはmain-wire側に残る。
- atrial parallel SLS：保持。LAだけをexact-offにすると、最終心拍の自己交差が1から4へ増え、
  reservoir-minus-conduit等容量差が0.409から0.261 mmHgへ36%低下した。onでは物理散逸
  0.349 mJ/beat、BE数値散逸0.029 mJ/beatで、物理散逸が約12.1倍を占めた。
- 2本目のMaxwell branch、LAA補正、long-axis補正は追加しない。

canonicalの最終心拍は自己交差1個、A/V lobe面積7.22/3.35 mmHg mL、reservoirが
conduitより上にあるprobe割合100%、LV EF 59.4%、CO 3.77 L/minであった。これは正常ヒト
acceptanceでも症例fitでもなく、構造比較のraw accepted-step結果である。LA volume
20.1--35.9 mLとCOはpopulation priorより低く、main-wire全血液量分配・冠循環統合後の未解決課題とする。
固定数値は
`data/myocardium/reports/mainwire-normal-five-wall-structural-ablation-v1.json`
に再現commandとともに保存する。

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
- q-offのTriSeg内部座標。reduced long-axisは陰性結果を再現するfalsification pathだけに残す
- 四心腔transmural pressure
- pure trial、明示commit、cold initialization、parameter identity

per-chamber providerが共有可変stateを参照する構造は禁止する。TriSegとlong-axisは四心腔を横断する
ため、一つのproviderが一貫したcandidateを評価する。

## 棄却された共有reduced isochoric long-axis座標

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

実際の固定閉ループでは52 msでboundへ到達したため、この停止規則を発動した。以下の式は
陰性仮説の再現性を保つための記録であり、canonical pressure ownerではない。

## 弁

弁の接続先、EOA、leak EOA、線形loss、opening stateはmain wire graphをownerとする。
一方、旧edge `B`と`L`はnormal chamber間flowに物理的でない高周波modeを作ったため、新しい
四心腔transactionではそのまま移植しない。

$$
A(\xi)=A_{leak}+\xi(A_{max}-A_{leak}),
$$

$$
R(A)=R_{open}\left(\frac{A_{ref}}{A}\right)^2,
\quad
B(A)=\frac{\rho}{2\cdot133.322}
\left(\frac{10^{-6}}{A_{m^2}}\right)^2,
$$

$$
\Delta P=R(A)Q+B(A)Q|Q|.
$$

$A$はeffective orifice area（EOA）、$\rho=1060\ \mathrm{kg/m^3}$、$C_d=1$とする。EOAが既に
contraction/dischargeを含むため、追加の$C_d$をfitしない。旧edge Bはこの構成に対しMV 0.50倍、
AoV 0.031倍、TV 1.61倍、PV 0.081倍で、特にsemilunar peak flowを過小減衰にしていた。

$Q$は各candidate pressureから単調な代数rootとして求め、独立memory stateにしない。$\xi$だけを
bounded opening stateとしてaccepted-state backward Eulerで進める。これにより旧モデルで
MV約10 Hz、AoV約33 Hzだったinertance--compliance ringingを除去した。root/vessel inertanceは
別pressure区間のmain-wire dynamic edgeが所有する。

$A_{leak}$は病的な双方向regurgitant orificeである。数値area floorとは別parameterにする。

- $A_{leak}=0$：完全閉鎖時の持続逆流をゼロにする
- $A_{leak}=0$：半滑らかな片側制約$Q\ge 0$とする
- $A_{leak}>0$：病的逆流として双方向flowを許す
- 固定reverse-flow capや$q$/$\dot q$ clampを形状調整には使わない

## 固定比較と停止規則

詳細parameter fittingの前に、次だけを固定比較する。

1. main wire circulation + joint four-chamber mechanics、$q_L$ off
2. 同一条件、$q_L$ on

この比較で$q_L$を棄却した後、弁hydraulicsとLA SLSをそれぞれ一回だけ固定ablationした。
Cd、B、L、$E_v$、$\tau_v$のscanは行っていない。

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

## 初回normal construction prior

初回比較はBSA 1.9 m2の一組だけを使う。これは患者fitでも、正常ヒトの完全な統計分布でもない。
解剖、材料、activationを別々の測定軸へ結び付けるためのpopulation-center constructionである。

| owner | 固定値 | 根拠と境界 |
|---|---:|---|
| LA blood volume | max/pre-A/min = 80.18/57.95/35.72 mL | healthy SSFP CMR population anchor |
| RA blood volume | 98.04/72.58/47.31 mL | 同上 |
| LA wall / unloaded cavity | 25.982906 / 22.890043 mL | mass+density、5 mmHg loaded-minimum inverse |
| RA wall / unloaded cavity | 23.399810 / 32.596871 mL | total atrial mass residual、3.5 mmHg construction |
| LVFW/SEP/RVFW wall | 67.075437/35.773566/36.087369 mL | pooled CMR mass、septumは一度だけcount |
| LVFW/SEP/RVFW reference area | 0.009354353/0.003965082/0.012911295 m2 | loaded ED geometryでlambda=1.10とするconstruction |
| TriSeg seed | V_S=42 mL, y=0.033 m | published initialization seed、runtime rootそのものではない |

心房equilibrium passiveはMoyer et al. の人LA材料を、

$$
F=\mathrm{diag}(\lambda,\lambda,\lambda^{-2})
$$

のincompressible equibiaxial pathへ厳密に縮約する。係数は

$$
C_1=1650\ \mathrm{Pa},\quad C_2=0,\quad
C_3=15\ \mathrm{Pa},\quad C_4=13.37
$$

である。RAへ同じ材料classを用いることは明示的な外挿である。心室equilibrium passiveは
CMR+TriSeg geometry上で正常Klotz EDPVR centerを再生する一つのorgan-scale constructionとし、
直接の組織材料同定とは主張しない。

Land activeは、心室3壁にAppendix B whole-organ列の$T_{ref}=120$ kPa、心房2壁にhuman LA
37 C force scaleから得た$T_{ref}=11.661151$ kPaを用いる。normalではorientation、viability、
slack stretchをすべて1に固定し、$T_{ref}$との冗長gainを作らない。

parallel SLSは一状態だけとする。beat-scaleの暫定priorは、healthy ovine RVFWのfast Prony branchを
単一Maxwell branchへ射影した

$$
E_v=0.149425\,K_{eq,ref},\qquad \tau_v=0.30\ \mathrm{s}
$$

である。これは種・壁をまたぐ外挿なので、固定ablationで独立したhysteresisと正の散逸へ寄与しない
場合、$E_v$や$\tau_v$を探索せずstateごと削除する。2本目のMaxwell branchは追加しない。

long-axis modeのgaugeは$a_{LVFW}=-1$に固定し、

$$
a_{LA}=1.6,\qquad a_{LVFW}=a_S=-1,
\qquad |q_L|<0.10
$$

とする。$a_{LA}$は正常LA reservoir strainとLV GLSの比から得たkinematic constructionであり、
PV loopからfitしない。bound hitはclamp後の成功ではなくstructural failureである。

初回の主比較はSLSを固定onにした$q_L$ off/onである。その後、SLSの存在意義だけを判定する
off/on ablationを一度行う。これはparameter searchではない。効果がなければSLSを削除する。

exact-off比較では$E_v=0$とし、LA SLSのstress、tangent、stored energy、物理散逸、BE数値散逸を
すべて厳密に0とした。RAと心室3壁はonのまま固定した。offでV-loop topologyと等容量枝差が
明確に悪化し、onの散逸は数値散逸でなく物理散逸が支配したため、一状態SLSを保持する。

## main-wire接続の段階境界

最初の閉ループtransactionはauthoritative main-wire node/edge定義から4心腔、体循環、肺循環を
そのまま抽出する。冠循環は心筋内外圧とactivation-dependent compressionを同時に移植するまで
一時的にscope外とし、独自の簡略冠血管へ置換しない。弁、血管PV law、waterfall、呼吸外圧、
total blood volumeはmain wire側だけが所有する。冠循環を除いた初回結果をfull main-wire runtimeと
呼ばない。

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
