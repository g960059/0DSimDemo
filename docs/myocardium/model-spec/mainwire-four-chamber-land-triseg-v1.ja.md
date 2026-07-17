# Main-wire由来 four-chamber Land–TriSeg V1 設計境界

## 状態

この文書は、main wire の循環graph定義を再利用して四心腔力学を検証する研究用sidecarの
設計仕様である。独立したBackward Euler transactionを持ち、`ModelCore` runtimeと同じ時間積分を
用いるわけではない。現時点ではbrowser runtime置換、正常ヒト較正、症例fitを主張しない。

目的は特定のLA PV形状を直接fitすることではない。正常域を含む広い負荷域で、reservoir、
conduit、booster pumpを同じ物理stateから生じさせ、将来は各parameterを独立計測へ対応づける。

## 2026-07-17 構造判定

固定HR 60、`dt=2 ms`、main-wire由来noncoronary実験循環、同一Ca priorでの反証試験から、canonical
構造を次のように更新した。

- shared long-axis $q_L$：棄却。onでは第1心拍52 msで$|q_L|=0.1$の宣言boundへ到達した。
  gain、bound、spring、dashpot、慣性を追加して救済しない。
- LAA+body：追加しない。過去の固定比較でV-loop拡大を所有しなかった。
- common pericardium：追加する。ただしV-loop拡大や全身血圧のfit ownerではない。scalar common bagが
  所有するのは保存的な共通容積拘束、静的心嚢液占有、tamponade/global-capacity機序までである。
  regional adhesion、局所心膜炎、呼吸性ventricular discordanceを含む収縮性心膜炎モデルではない。
  肺高血圧の主ownerは肺血管側であり、このPRで症例再現は主張しない。
- 弁：chamber間の独立flow inertanceを棄却し、EOA由来Bernoulli損失を持つ準定常orificeへ簡約した。
  Ao/PA rootと血管edgeのinertanceはmain-wire側に残る。
- LA parallel SLS：暫定保持。LAだけをexact-offにすると、最終心拍の自己交差が1から4へ増え、
  reservoir-minus-conduit等容量差が0.409から0.261 mmHgへ36%低下した。onでは物理散逸
  0.349 mJ/beat、BE数値散逸0.029 mJ/beatで、物理散逸が約12.1倍を占めた。
- RAと3 ventricular wallのSLS：固定exact-off監査で効果を確認したため、各1-stateを保持する。
  ただしcross-wallで共有したovine-RV由来priorの値は同定済みとみなさない。
- 2本目のMaxwell branch、LAA補正、long-axis補正は追加しない。

この時点のpre-pericardium structural-ablation baselineの最終心拍は自己交差1個、
A/V lobe面積7.22/3.35 mmHg mL、reservoirが
conduitより上にある割合は当時のreportがusableと判定したprobe集合内で100%、LV EF 59.4%、
CO 3.77 L/minであった。これは正常ヒト
acceptanceでも症例fitでもなく、構造比較のraw accepted-step結果である。LA volume
20.1--35.9 mLとCOはpopulation priorより低く、main-wire全血液量分配・冠循環統合後の未解決課題とする。
固定数値は
`data/myocardium/reports/mainwire-normal-five-wall-structural-ablation-v1.json`
に再現commandとともに保存する。

## 陰性だった構造を本体へ積層しない

簡略循環sidecarの固定比較では、次の変更はV-loopを意味のある程度には拡大しなかった。

- LA bodyとLAAの代数的common-pressure並列化
- common pericardial pressureをV-loop修正項として用いること
- 一状態Maxwell springの有限ひずみ非線形化
- LA volumeだけで駆動される受動isochoric aspect-ratio state

これらをV-loop修正要素として新しい本体へ積層しない。LAAは血栓・stasis・LAA interventionを
扱う段階で独立した流体・壁ownerとして再検討できるが、正常V-loopを作るための補正項にはしない。
心膜は共通外圧の独立ownerとして常設するが、V-loop面積のownerとはみなさない。正常基準では
位相整合したED/ES anchorの大きい方に、V1のslack construction用model priorとして5%の容量reserveを置き、
elastic branchがexact slackであってよい。この5%はヒトの普遍定数でもpopulation同定値でもない。これは
「モデルから心膜を外す」ことと異なり、同じequation familyを保つ。症例parameterを変更した場合は
そのbinding snapshotとparameter identityを別protocolとして必ず記録する。

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

## 循環の所有境界

node/edge定義、血管PV law、基礎抵抗、呼吸外圧のsource ownerはmain wireとする。本sidecarは
これらを抽出するが、血液量state、Newton residual、Backward Euler commitは独立実装である。
したがって本結果を`ModelCore` runtime結果とは呼ばない。

- 4心腔
- Ao–SA–Art–Cap–SV–VC
- PA–PArt–PCap–PVen–PVein
- 動脈指数型PV law
- collapse/open/distendedを連続化した静脈PV law
- Pth、Palv、waterfall
- graph incidenceによる血液量balance

冠循環、activation-dependent coronary compression、collapsible-tube $\chi$補正は未接続である。
独自の簡略4血管や定流量PV sourceへ置換せず、通常のaccepted transactionではincidence balanceを
mass ownerとし、TBV projectionはゼロであることを要求する。

## 四心腔力学provider

循環の外側Newtonは、各candidate chamber blood volumeをprevious accepted mechanics stateとともに
四心腔力学providerへ渡し、pure trialを評価する。収束した最終candidateだけをatomic commit後に
accepted stateとする。providerは一つのtransactionとして次を所有する。

- LA、RA：Land active + equilibrium passive + 必要最小限のparallel Maxwell
- LV、RV、septum：Land active + equilibrium passive + parallel Maxwell + TriSeg
- finite-thickness curvature correctionを含むTriSeg membrane virtual-work lawの2つの代数内部座標
- Koiter bending energy、bending moment、reference-curvature fitを持たない
- 四心腔transmural pressure
- pure trial、明示commit、cold initialization、parameter identity

per-chamber providerが共有可変stateを参照する構造は禁止する。TriSegは両心室とseptumを横断するため、
一つのproviderが一貫したcandidateを評価する。

Land active-myofilament lawは5壁すべてで6-state full kernelを使い、心房だけpopulation-onlyへ
縮約しない。受動則はMoyer/Klotz、粘弾性は外部parallel SLSがownerであり、Landへ含めない。すなわち
crossbridge populationに加え、weak/strong distortion historyも残す。series elementと外付け
force--velocity multiplierは追加しない。

## 保存的common pericardium

心膜内の心臓容積を

$$
V_h=V_{LA}+V_{LV}+V_{RA}+V_{RV}+\sum_{w=1}^{5}V_w
$$

とし、静的な心嚢液占有容積が与えられる症例では

$$
V_{occ}=V_h+V_{fluid}
$$

をelastic bagへ入力する。$V_{fluid}$は血液量ではなく、初手では動的stateでもない。したがって
TBV ledgerへ加えてはならない。

$$
x=\frac{V_{occ}-V_{h0}}{V_{h0}}
$$

に固定幅$\delta=10^{-3}$の$C^2$ smooth positive part $s_\delta(x)$を適用し、

$$
\Psi_{peri}
=P_{offset}V_{occ}
+\frac{P_0V_{h0}}{k}
\left[
\exp\{ks_\delta(x)\}-1-ks_\delta(x)
\right]
$$

とする。共通心膜圧と接線は同じenergyから

$$
P_{peri}=\frac{\partial\Psi_{peri}}{\partial V_{occ}},
\qquad
K_{peri}=\frac{\partial P_{peri}}{\partial V_{occ}}\ge0
$$

を使う。絶対心腔圧は

$$
P_c^{abs}=P_c^{tm}+P_{th}+P_{peri},
\qquad c\in\{LA,LV,RA,RV\}
$$

である。心膜は4腔すべてに同じ圧を一度だけ加え、TriSegの2内部座標へ直接forceを追加しない。
壁容積一定なら

$$
\dot\Psi_{peri}
=P_{peri}(\dot V_{LA}+\dot V_{LV}+\dot V_{RA}+\dot V_{RV})
$$

であり、心膜仕事をprescribed external-pressure workへ重複計上しない。

normal-adult fixed constructionは、同一時相として整合する次の2候補、

$$
V_h^{ED}=V_{LA,min}+V_{RA,min}+V_{LV,EDV}+V_{RV,EDV}+\sum_wV_w,
$$

$$
V_h^{ES}=V_{LA,max}+V_{RA,max}+V_{LV,ESV}+V_{RV,ESV}+\sum_wV_w
$$

の大きい方に5% reserveを持つ$V_{h0}$を使う。現priorではED候補が支配し、
$V_{h0}\simeq600.13$ mLである。5% reserveはこのV1のmodel priorであり、ヒトの普遍定数ではない。
$P_0=500$ Pa、$k=8$、prescribed pressure offsetは0とする。
これはpopulation-centerから構成したreduced occupied-volume priorで、同一被験者の同時計測CMRではない。
冠血管、root近位部、epicardial fatも含まない。これらを正常血圧やLA PV形状へfitしない。
$V_{h0}$、$k$、$V_{fluid}$の症例変更は、両心室volume/load、
心膜圧、画像上のeffusionなど独立情報がある場合に限る。

実装検証専用の固定positive controlは、任意parameter探索を避けるため次の2つだけを公開する。

- global-capacity control：$V_{h0}=430$ mL、$V_{fluid}=0$
- effusion-volume：normalの$V_{h0}$を保ち、$V_{fluid}=300$ mL

$P_0=500$ Pa、$k=8$、pressure offset=0は両armで不変である。430 mLと300 mLは患者値や正常値ではなく、
凍結した正常baselineの最大心臓容積に対して心膜lawを確実にengageさせるround-numberのmechanism
checkである。scalar common bagはregional adhesion、局所心膜炎、呼吸性ventricular discordance、
uncoupled chamber constraintまでを表す収縮性心膜炎モデルではない。CLIから任意の容量・stiffness・fluidを渡してPV形状を
探索するinterfaceは作らない。

数値的には心膜は新しいunknownもmemory stateも追加しない。14-volume外側Newtonのcandidate
pressure callbackで評価し、現在の有限差分Jacobianがその結合を含む。$K_{peri}$のSI単位は
Pa/m3である。将来のanalytic tangentでは、4腔pressure--volume callback block
$\partial P_c/\partial V_{c'}$へ単位変換後の$K_{peri}\mathbf 1\mathbf 1^T$という
positive-semidefinite rank-one項を入れる。14×14 continuity-residual Jacobianには、flow law、mmHg/mL
変換、時間離散化を含むchain ruleを適用し、生の$K_{peri}$を直接加えない。

## PR 475型の数値実装と検証continuation

循環Backward Eulerの大域未知数は、15 node volumeのうちTBVから従属化したSVを除く14 volume
だけである。5壁のfull 6-state Land active kernel、5個のparallel SLS、TriSeg 2内部座標、4弁opening、
Ao/PA root flowは
candidate評価の局所stateとして扱う。心膜は代数評価なのでunknownを増やさない。現段階の外側
14×14と内側TriSeg 2×2のJacobianは有限差分であり、exact Schur complementやconsistent tangentを
実装済みとは主張しない。

反復検証は、旧exact-slack構成の4 ms period-1解を初期seedとし、現在の
phase-consistent心膜referenceだ4 ms解へ一度continuationした。そのcycle-boundary checkpointを
2 ms、1 msへ順次移す。
checkpointは単なる高速化用初期条件で、各dtは既存の$10^{-3}$ groupwise closureを3拍連続で満たして
初めてperiod-1とする。checkpointには次を含める。

- 15 node volume、Ao/PAの2 dynamic flow、4弁opening
- 5壁×6個のLand state、5個のSLS viscous strain、wall input history
- TriSeg 2内部座標
- circulation、coupled transaction、warm-start envelopeそれぞれのschema versionとfingerprint
- source protocol identity record、全component hash、source dt、beat数

restore時はsource identityとcheckpoint fingerprintを検証する。mechanics、Ca、循環topology/runtime、
periodic policyの差は拒否する。動的stateを持たないcommon pericardiumだけはcross-protocol初期条件として
変更可能だが、source/target心膜hashと`common-pericardium-only`差分をresultへ明示する。fingerprintは
再現性・偶発改変検出用のstable hashであり、暗号学的署名ではない。

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

実際の固定閉ループでは52 msでboundへ到達したため、この停止規則を発動した。上式は
陰性仮説の記録であり、実装、state、prior、runner pathはcanonical coreから削除した。

## 弁

弁の接続先、EOA、leak EOA、線形loss、opening priorのparameter sourceはmain wire graphとする。
leaflet openingのaccepted state、Backward Euler更新、準定常flow law、commitは実験sidecarがownerである。
旧edge `B`と`L`はnormal chamber間flowに物理的でない高周波modeを作ったため、新しい
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
\Delta P=R(A)Q+B(A)Q\sqrt{Q^2+\epsilon_Q^2}.
$$

$A$はeffective orifice area（EOA）、$\rho=1060\ \mathrm{kg/m^3}$、$C_d=1$とする。EOAが既に
contraction/dischargeを含むため、追加の$C_d$をfitしない。旧edge Bはこの構成に対しMV 0.50倍、
AoV 0.031倍、TV 1.61倍、PV 0.081倍で、特にsemilunar peak flowを過小減衰にしていた。

$Q$は各candidate pressureから単調な代数rootとして求め、独立memory stateにしない。accepted
memoryは`leafletOpeningFraction01`（$\xi$）ただ一つであり、$Q$はevaluation readbackにだけ置く。
$\xi$をbounded opening stateとしてaccepted-state backward Eulerで進める。これにより旧モデルで
MV約10 Hz、AoV約33 Hzだったinertance--compliance ringingを除去した。root/vessel inertanceは
別pressure区間のmain-wire dynamic edgeが所有する。

$B$は公開調整parameterとして保持せず、各evaluationで現在の数値EOAから上式により直接導出する。
main-wire edgeの旧`B`と`L`はこのchamber間orificeでは読まない。MV opening targetに限っては、既存
main-wire topologyが所有する0.60 mmHg deadbandを明示的に参照する。これは現行出力を保つための
未検証main-wire priorであり、この実験のfit knobでも、生理学的に較正済みの弁圧較差でもない。

$A_{leak}$は病的な双方向regurgitant orificeである。数値area floorとは別parameterにする。

- $A_{leak}=0$：完全閉鎖時の持続逆流をゼロにする
- $A_{leak}=0$：半滑らかな片側制約$Q\ge 0$とする
- $A_{leak}>0$：病的逆流として双方向flowを許す
- 固定reverse-flow capや$q$/$\dot q$ clampを形状調整には使わない

competent valveの閉鎖時はopen-orifice式の残差を0と偽装せず、contact reaction
$\lambda_c$を導入した相補性条件として読む。

$$
Q\ge 0,\qquad \lambda_c\ge 0,\qquad Q\lambda_c=0,
$$

$$
\Delta P-R(A)Q-B(A)Q\sqrt{Q^2+\epsilon_Q^2}+\lambda_c=0.
$$

逆圧較差で$Q=0$のとき、open-orifice residualは負のまま、$\lambda_c=-\Delta P>0$がhydraulic
balanceを閉じる。したがって閉鎖弁を「開放orifice residualが0」とは報告しない。

## 固定比較と停止規則

詳細parameter fittingの前に、次だけを固定比較する。

1. main-wire由来循環 + joint four-chamber mechanics、$q_L$ off
2. 同一条件、$q_L$ on

この比較で$q_L$を棄却した後、弁hydraulicsとLA SLSをそれぞれ一回だけ固定ablationした。
Cd、B、L、$E_v$、$\tau_v$のscanは行っていない。

棄却試験ではLA/LV PV、LAP/LVP、MVF、PVFだけでなく、

- $G_q$とwall別virtual work
- reservoirとconduitの同一volume圧差
- x、v、y timingと振幅
- LV EF、EDPVR、relaxation
- qのbound hit、総接線、root uniqueness
- graph mass ledger、通常時TBV projection量
- valve opening residual、open-orifice residual、contact reaction、相補性積、hydraulic/power balance

を含める。

$q_L$ onがV-loopの因果方向を改善せず追加damping/gainなしでは成立しなかったため、そこで停止した。
さらにshape stateを追加して救済しない。

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

このpopulation volumeはgeometryと検証のanchorであり、現閉ループのcold state ownerではない。
LA/RA minimumとLV/RV EDへ直接差し替え、正味差を`SV`でTBV保存する固定試験は、canonical onで
6.14 sにmechanics許容境界へ到達し、LA-SLS exact-offでは0.395 sに接線監査を通過しなかった。
LM、damping、監査緩和で救済せず、この初期化pathは削除した。production採用前にはmain-wire全stateを
対象にしたperiodic initialization／shootingを別課題として実装する。

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

`dt=2 ms`のcanonical paired reportでexact-off evidenceがあるのはLAだけである。後述する
`dt=5 ms`の固定構造監査ではRA単独offと心室3壁一括offも評価するが、RAへhuman-LA材料を使うこと、
LA/RAとLVFW/SEP/RVFWへ同じProny比を使うことはいずれも外挿であり、各壁の材料parameterが
同定済みとは主張しない。

棄却したlong-axis試験ではgaugeを$a_{LVFW}=-1$に固定し、

$$
a_{LA}=1.6,\qquad a_{LVFW}=a_S=-1,
\qquad |q_L|<0.10
$$

とする。$a_{LA}$は正常LA reservoir strainとLV GLSの比から得たkinematic constructionであり、
PV loopからfitしない。bound hitはclamp後の成功ではなくstructural failureである。

初回の主比較はSLSを固定onにした$q_L$ off/onである。その後、SLSの存在意義だけを判定する
off/on ablationを一度行う。これはparameter searchではない。効果がなければSLSを削除する。

LA exact-off比較では$E_v=0$とし、LA SLSのstress、tangent、stored energy、物理散逸、BE数値散逸を
すべて厳密に0とした。RAと心室3壁はonのまま固定した。offでV-loop topologyと等容量枝差が
明確に悪化し、onの散逸は数値散逸でなく物理散逸が支配したため、一状態SLSを保持する。

追加の固定構造監査はHR 60、`dt=5 ms`、同一cold stateで12拍を各1回だけ行った。RA exact-offでは
RA loopが1 crossingから2 crossingsへ崩れてlobe測定不能となり、RA等容量枝差は
0.403から0.247 mmHgへ38.8%低下した。canonical RA SLSの物理散逸は0.300 mJ/beatであった。
RA stateは左心への影響が小さくても右心hysteresisを所有するため削除しない。

LVFW/SEP/RVFWを一括exact-offにするとLA V-loopは3.397から5.859 mmHg mLへ増えたが、A-loopは
5.690から0.516 mmHg mLへ90.9%減少し、LAP/LVP minimum、MVO、E/A、COも同時に変わった。
これはV-loopだけの改善でなく別の拡張期生理への移行である。V-loop拡大を目的にventricular SLSを
削除しない。canonicalでの物理散逸はLA/RA/LVFW/SEP/RVFWの順に
0.350/0.300/16.49/7.22/6.21 mJ/beatで、各離散energy balanceは丸め誤差内で閉じた。
ただし12拍時点のperiod-1 closureは0.8--1.6%であり、これらはparameter同定ではなく暫定的な
構造保持判断である。

旧pre-pericardium SLS ablationの厳密なgroup-wise周期検証は
`docs/myocardium/verification/mainwire-normal-adult-five-wall-periodic-v1.ja.md`に分離した。当時のbaselineと
LA-SLS exact-offは`dt=2 ms`でともに27拍目にperiod-1へ収束し、周期解同士でもSLS offはLA PVを
1交点から小さな追加交点を含む4交点へ変えた。ただし大域的なreservoir--conduit順序はoffでも残るため、
SLSはV-loopの唯一の生成機序ではなく、このablationの証拠境界は`dt=2 ms`に限る。

common-pericardium追加後の現構造は
`docs/myocardium/verification/mainwire-full-land-membrane-pericardium-v1.ja.md`を正準の数値記録とする。
旧exact-slack 4 ms seedは27拍でperiod-1へ収束した。そのcheckpointから現在の
phase-consistent心膜referenceの4 ms解へは3拍、同じ現在checkpointから4 ms parity replayは3拍、
2 msは7拍、1 msは6拍でperiod-1へ収束した。現比較は4腔volume/pressure、全弁flow/opening、
肺静脈流、心膜、LA stress/strainの
23信号を含む。LA V-loopは4/2/1 msで3.548/3.434/3.380 mmHg mL、reservoir--conduit mean gapは
0.405/0.414/0.417 mmHgで、one true crossingと枝順序を保持した。一方A-loopは
6.315/7.516/8.283 mmHg mLで変化し、1 msだけ小さな肺動脈弁late reopeningを持つ。したがって
V-lobe topologyと枝順序以外の時間刻み独立性、漸近収束次数、生理的合格を主張しない。

周期診断のMVO/MVCはflow-threshold transitionであり、MVCはatrial Ca onset以後の最初のclosureを採る。
E/Aの`separated`はE/A window peak間のforward-flow valley診断で、弁閉鎖とは別の意味を持つ。
現在もA apexは左寄りで、aggregate pulmonary venous Ar reversalはほぼない。これらをSLS parameterや
activation timingの形状fitだけで解消せず、独立Ca/force dataとmain-wire統合後のPV physiologyで再評価する。

## main-wire接続の段階境界

最初の閉ループtransactionはmain-wire node/edge定義から4心腔、体循環、肺循環を抽出するが、
時間積分と弁則は実験側が所有する。冠循環は心筋内外圧とactivation-dependent compressionを同時に移植するまで
一時的にscope外とし、独自の簡略冠血管へ置換しない。弁、血管PV law、waterfall、呼吸外圧、
total blood volumeのparameter sourceはmain wireに置く。冠循環を除いた初回結果をfull main-wire runtimeと
呼ばず、弁のEOA解釈もこの実験の仮説境界に限定する。

## Fit-readyで守る同定規則

状態数を増やす前に、各parameterを独立データへ対応づける。

- wall massと心腔容積：CMR/CT
- viable fraction：LGE等の組織情報。0をexact active-offとして許す
- valve $A_{max}$、$A_{leak}$、$\xi(t)$：echo/valve imaging
- AV timing：ECGとtwitch/Ca timing。PV loop単独からAV delayと両側electromechanical delayを同時fitしない
- SLS：strain-rate、stress relaxationまたは独立hysteresisデータ。Ca decayとSLS $\tau$をPV形状だけで同時fitしない

$T_{ref}$、Ca振幅、orientation、viabilityはactive stress上で強く交絡する。normalではorientationと
viabilityを1に固定し、症例fitでも独立計測がなければ同時に自由化しない。reference volumeとpassive
stiffness、Land slack stretchも同時fitしない。数値area floorとsmoothing幅はsolver regularizationであり、
患者parameterにしない。Ca pulse振幅0とviability 0は新しいstateを足さずexact-offを表現できる。
現V1の`parameterIdentityHash`は物理係数だけでなくprovenance、policy、claim metadataも含む
configuration identityであり、同定済みphysics hashとは呼ばない。

## 生理学的根拠と限界

LA reservoirはLA relaxationだけでなくLV systolic long-axis shortening/base descentに依存することが
実験的に示されている（Barbier et al., 1999, DOI 10.1161/01.CIR.100.4.427）。LA conduitは
left-heart constant-volume状態からの逸脱とLV early fillingに依存する
（Bowman and Kovacs, 2004, DOI 10.1152/ajpheart.00969.2003）。詳細whole-heart
electromechanicsは分布変形と閉ループ循環から生理的なatrial figure-eight PV loopを再現している
（Fedele et al., 2023, DOI 10.1016/j.cma.2023.115983）。

一方、明示AVPD stateなしのsarcomere-based closed-loop modelでもfigure-eight loopは生成可能である
（Pironet et al., 2013, DOI 10.1371/journal.pone.0065146）。したがって$q_L$はV-loopの数学的必要条件
とは主張しない。本モデルでは最小仮説として反証し、canonical coreから削除した。将来AVPD/MAPSEを
必要とする場合は、まずobservableとして追加し、独立画像でpressure feedbackの必要性が示された場合だけ
新しいmechanical coordinateを設計する。
