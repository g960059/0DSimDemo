# 4腔 One-Fiber–Land–有限厚TriSeg–main-wire分布循環 mechanistic rebuild v2

## 0. 文書の位置づけ

本書は、`phase-b1-four-chamber-mechanistic-rebuild-case-v2` の**現在の実装と、統合検証中の選定済み数理仕様**を記述する。実装済み／未統合の境界はSection 16で明示し、仕様選定をruntime採用またはvalidation済みという主張へ読み替えない。目的は、心房PVループの形を直接描き合わせることではなく、解剖、材料、能動収縮、循環、弁、心室間相互作用を責任分離したうえで、正常成人から多様な病態へ拡張できる4腔閉鎖循環モデルを作ることである。

設計の中心は次の6点である。

1. browser main-wireと同じbaseline topology/parameter ownerから解決した、非冠循環15血液区画で総血液量を厳密に保存する。ただしeffective-parameter変換と数値積分はresearch-only経路であり、runtime parityを主張しない。
2. LA/RAは、それぞれone-fiber壁とし、CMR最小容積を無負荷形状と誤認せず、Moyer 2015の受動則から逆除荷する。
3. LVFW/SEP/RVFWはone-fiber Land壁として、有限厚・仕事共役なTriSegで結合する。
4. Landはactive-onlyで使い、巨視的series elementを加えない。SLSはLandとは独立の受動粘弾性として持つ。
5. pre-A心臓作動点、分布血管のTBV整合初期化、period-1軌道の成立を別問題として解く。
6. AVPD、MAPSE、TAPSE、s'、a'はcoreの力学自由度にせず、将来のcomputed observableとする。

現ブランチはcandidate/research実装であり、`ModelCore`やbrowser runtimeへ採用済みとはみなさない。また、正常成人の生理学的validation、患者固有fit、疾患parameterの同定を完了したとは主張しない。

### 0.1 設計上の非目標

このphaseでは、以下を目的関数または合否条件にしない。

- LA/RA PVループの自己交差数。
- SLS-offで8の字トポロジーが残ること。
- 白背景reference loopへの形状距離。
- 心房v-loopの面積を増やすための圧gain、残留応力、時相依存補正。
- 壁ごとの自由なLand gain。
- pericardiumを使った全身血圧の底上げ。
- AV-planeばね・質量・ダンパーによるx谷の直接生成。
- time-varying elastance、心周期phaseでon/offする外力、PV座標へ直接加える補正力。
- 独立な局所ひずみ・弁輪形状データなしに追加する心房shape state。

心房PVループは重要であるが、壁構成則だけの観測量ではない。静脈還流、房室弁流、心室弛緩、心房収縮、心膜圧、SLS履歴が同時に作る全体系観測量である。PV metricをconstructorまたは連続parameterの数値目的関数には渡さないが、現architectureの選択は旧closed-loop診断にinformされているため、本candidateでは**development diagnosticであって独立hold-out validationではない**。

## 1. 状態、代数未知数、責任分離

### 1.1 血液区画と流れ

新しい分布循環candidateの血液区画は

$$
\begin{aligned}
\mathcal C={}&\{LA,LV,RA,RV,\\
&Ao,SA,Art,Cap,SV,VC,\\
&PA,PArt,PCap,PVen,PVein\}.
\end{aligned}
$$

4心腔以外の11区画、11血管edge、基準parameterは、Phase-B1内に別のbaseline表を持たず、`buildNodes()`、`buildEdges()`、`defaultParams()`をsource ownerとするresolverから得る。`venousTone`、`arterialStiffness`、体・肺血管抵抗倍率、および症例別`nodeOverrides/edgeOverrides`も同じresolverで有効値へ変換する。ただし、現V1の有効値変換は`ModelCore#setImmediateParameters`の規則を手動でmirrorした実装であり、両経路が単一のcanonical effective-parameter resolverを共有しているわけではない。そのため`modelCoreNumericalRuntimeParityClaimed=false`を固定する。冠循環はこのphaseでは明示的に除外する。

正方向は

$$
\begin{aligned}
LV&\xrightarrow{Q_{AoV}}Ao\xrightarrow{Q_{Ao\_SA}}SA
\xrightarrow{Q_{SA\_Art}}Art\xrightarrow{Q_{Art\_Cap}}Cap\\
&\xrightarrow{Q_{Cap\_SV}}SV\xrightarrow{Q_{SV\_VC}}VC
\xrightarrow{Q_{VC\_RA}}RA\xrightarrow{Q_{TV}}RV\\
&\xrightarrow{Q_{PuV}}PA\xrightarrow{Q_{PA\_PArt}}PArt
\xrightarrow{Q_{PArt\_PCap}}PCap\\
&\xrightarrow{Q_{PCap\_PVen}}PVen\xrightarrow{Q_{PVen\_PVein}}PVein
\xrightarrow{Q_{PVein\_LA}}LA\xrightarrow{Q_{MV}}LV
\end{aligned}
$$

とする。

現V1で微分状態として持つ慣性流は

$$
\{Q_{MV},Q_{AoV},Q_{TV},Q_{PuV},Q_{Ao\_SA},Q_{PA\_PArt}\},
$$

残る9血管流は同一時刻の圧から解く符号付き代数流である。main-wireには`PVein_LA`を正のostial inertanceで動的化する経路もあるが、現V1は基準の$L_{PVein\_LA}=0$に固定した6-flow topologyである。症例overrideで$L_{PVein\_LA}>0$が指定された場合は、状態数を黙って変えず、7-flow variant未実装としてfail-closedにする。$R$と$B$のoverrideは$L=0$でも有効である。

### 1.2 壁と内部状態

壁は

$$
\mathcal W=\{LA,RA,LVFW,SEP,RVFW\}
$$

である。全5壁がone-fiber構成を持ち、各壁の総Kirchhoff線維応力を

$$
\tau_{f,w}
=\tau_{\infty,w}(e_{f,w})
+\tau_{Land,w}(\mathbf y_w,Ca_w,\lambda_w)
+q_{v,w}
$$

と分解する。

- $\tau_\infty$：平衡受動材料。
- $\tau_{Land}$：Land active-only。
- $q_v$：独立SLSの超過応力。

心室TriSegの形状未知数は

$$
\mathbf q_g=(V_{m,S},y_m)
$$

であり、微分状態ではなく各時刻の力学平衡から決まる代数未知数である。$V_{m,S}$は中隔中壁cap volume、$y_m$は3壁共通のjunction radiusである。

### 1.3 owner表

| 量 | owner | 禁止する代替 |
|---|---|---|
| 血液量 | main-wire由来15区画incidence ledger | 隠れreservoir、拍ごとのvolume projection |
| 血管parameter/topology | `buildNodes/buildEdges/defaultParams` shared resolver | Phase-B1内の複製parameter表 |
| 慣性流 | 4弁 + Ao/PA root momentum | 負流量clamp、事後zeroing |
| 弁開口 | main-wire由来4弁のpressure-driven aperture state | phase gate、流量diode、PV形状による時定数fit |
| 末梢・静脈流 | 9本の同時刻符号付き代数root | 旧`Qsys/Qpul/QVC/QPV` aggregateとの併用 |
| 心房ひずみ | LA/RA one-fiber幾何 | 心房圧gain |
| 心室ひずみ・圧 | finite-thickness TriSeg | PV形状に合わせる壁別gain |
| 平衡受動応力 | Moyer atrial / effective ventricular energy | Land内受動応力との二重計上 |
| 能動応力 | Land 2017 | 巨視的series element、自由な壁別scale |
| 粘弾性 | 独立1-state SLS | 圧波形平滑化filter |
| 外圧 | 胸腔圧 + common pericardium | 心房・心室ごとの任意offset |
| AVPD等 | 将来のobserver | coreへ未同定のAV-plane力学を追加 |

## 2. 15区画閉鎖循環と血液量保存

各区画の保存式は

$$
\begin{aligned}
\dot V_{LV}&=Q_{MV}-Q_{AoV},
&\dot V_{Ao}&=Q_{AoV}-Q_{Ao\_SA},\\
\dot V_{SA}&=Q_{Ao\_SA}-Q_{SA\_Art},
&\dot V_{Art}&=Q_{SA\_Art}-Q_{Art\_Cap},\\
\dot V_{Cap}&=Q_{Art\_Cap}-Q_{Cap\_SV},
&\dot V_{SV}&=Q_{Cap\_SV}-Q_{SV\_VC},\\
\dot V_{VC}&=Q_{SV\_VC}-Q_{VC\_RA},
&\dot V_{RA}&=Q_{VC\_RA}-Q_{TV},\\
\dot V_{RV}&=Q_{TV}-Q_{PuV},
&\dot V_{PA}&=Q_{PuV}-Q_{PA\_PArt},\\
\dot V_{PArt}&=Q_{PA\_PArt}-Q_{PArt\_PCap},
&\dot V_{PCap}&=Q_{PArt\_PCap}-Q_{PCap\_PVen},\\
\dot V_{PVen}&=Q_{PCap\_PVen}-Q_{PVen\_PVein},
&\dot V_{PVein}&=Q_{PVen\_PVein}-Q_{PVein\_LA},\\
\dot V_{LA}&=Q_{PVein\_LA}-Q_{MV}.&&
\end{aligned}
$$

よって、離散化前の連続系では

$$
\frac{d}{dt}\sum_{c\in\mathcal C}V_c=0
$$

が恒等的に成り立つ。実装では各edge incidence列が必ず$-1$を1個、$+1$を1個持ち、列和0であることを構造監査する。総血液量$V_{blood}$はparameterであり、解の破綻を後から直す補正量ではない。

## 3. 血管、末梢抵抗、弁、静脈入口

### 3.1 main-wire血管PV則

各血管区画$i$では

$$
V_i=V_{u,i}+V_{s,i}(P_i^{tm}),
\qquad
P_i^{abs}=P_i^{tm}+P_{ext,i}
$$

とする。$V_u$は固定されたunstressed volumeであり、静脈では`venousTone`によりmain-wireと同じ規則で変化する。preloadまたは総血液量を変えるたびに$V_u$を再同定してはならない。

動脈区画`Ao/SA/Art/PA/PArt`は

$$
V_s=V_{s,eff}\log\left(1+\frac{P^{tm}}{P_0}\right),
\qquad
C(P^{tm})=\frac{V_{s,eff}}{P_0+P^{tm}}
$$

であり、`arterialStiffness`は$V_{s,eff}$を連続的に変える。`Cap`は線形則$V_s=CP^{tm}$を使う。research adapterでは、stiffness、compliance、transition幅、抵抗、inertance、二次損失の不正値を暗黙floorへ置換せず拒否する。従って、要求parameterと実効parameterが無記録に異なることはない。

`SV/VC/PCap/PVen/PVein`はcollapsible、open、distendedの3領域を滑らかに接続する。complianceは

$$
\begin{aligned}
C_v(P)={}&C_{coll}
+(C_{open}-C_{coll})\,s\!\left(\frac{P-P_{open}}{d_{open}}\right)\\
&-(C_{open}-C_{dist})\,s\!\left(\frac{P-P_{stiff}}{d_{stiff}}\right),
\end{aligned}
$$

で、$s$はsigmoidである。$V_s(P)=\int_0^P C_v(p)\,dp$は同じsoftplus primitiveから厳密に評価する。従って肺静脈圧を単一`PV` complianceに保持させず、肺動脈、肺毛細管、肺静脈、近位肺静脈のstorageと圧降下を分ける。

これらのlog動脈則、3領域静脈則、区画数、係数はmain-wireから継承する**project constitutive prior**であり、StergiopulosまたはGerringerの式を直接移植したものではない。両文献はR/C/Iと分布storageを分離して扱う構成概念を支持するが、現在のヒト正常15区画parameterをvalidationしない。したがって病態表現力の根拠と、個々の係数の同定根拠を混同しない。

このtopology変更の直接の根拠は、旧aggregate波形でLA容積が約0.646 s、36.7 mLで最小となり、その時点で$Q_{PV}\approx Q_{MV}\approx240$ mL/sだったにもかかわらず、単一PV区画が約13.3 mmHgの上流圧を保持し、その後$Q_{PV}>Q_{MV}$となって0.8 sまでに約12.7 mLを再充満したことである。心房壁エラスタンスの符号を補正してもこの質量収支は変わらない。そこで壁材料をPV形状へfitせず、肺血管のstorageと圧降下をmain-wireの実在ownerへ分解する。

SI adapterは$\Psi_i(V)=\int P_i^{tm}\,dV$を計算し、$d\Psi_i/dV=P_i^{tm}$を監査する。静脈parameter overrideは、現V1のreviewed逆写像support $[-20,45]$ mmHg全域でraw complianceが正・finiteであることをinterval subdivisionでcompile時に証明できなければ拒否する。volume/inverse/energyで異なるcompliance floorを使わない。有限supportはNewtonのnode別volume上下限制約へ変換し、accepted stateごとに最小domain marginを報告する。support外のtrialだけをtyped recoverable domain rejectionとして扱い、invariant・layout・programming errorと混同しない。main-wireのtopology・parameter適用は共有するが、数値semanticsは意図的に置換する。すなわちflow clampとstate projectionを使わず、PV逆写像のsupport外は端値clipではなく拒否する。なお、この$[-20,45]$ mmHgは病態全域を表す生理的境界ではない。より広い病態で必要なら、raw complianceが単調な最大区間をparameterごとに構成する次variantへ拡張し、端値clipで広げない。

### 3.2 血管flow、waterfall、符号付きmomentum equation

慣性を持つ`Ao_SA`と`PA_PArt`は

$$
L_j\dot Q_j=\Delta P_j-R_jQ_j-B_jQ_j|Q_j|
$$

を解く。他の9血管edgeは同じ式の$L=0$ rootを符号付きで解き、逆流をclampしない。`VC_RA`と`PCap_PVen`では、下流実効圧を胸腔圧または肺胞圧に基づくcollapse pressureとのsmooth maximumに置き換えるStarling-resistor型waterfallを使う。

4弁は、main-wireの`buildEdges()`と`defaultParams()`が所有する$A_{ref}$、$A_{max}$、$A_{leak}$、$k_{open}$、$\tau_{open}$、$\tau_{close}$、$R_0$、$L$、$B_0$を解決し、圧較差で駆動される開口state $\xi\in[0,1]$を持つ。Phase-B1内に別の弁parameter表を置かない。

まず

$$
h(u)=
\begin{cases}
0,&u\le0,\\
6u^5-15u^4+10u^3,&0<u<1,\\
1,&u\ge1
\end{cases}
$$

とし、$\Delta P=P_{up}-P_{down}$、$w_P=133.322387415/k_{open}$ Paに対して

$$
k_o(\Delta P)=\frac{h(\Delta P/w_P)}{\tau_{open}},
\qquad
k_c(\Delta P)=\frac{h(-\Delta P/w_P)}{\tau_{close}},
$$

$$
\dot\xi=k_o(1-\xi)-k_c\xi
$$

を解く。Backward Eulerではendpoint圧から$k_o^{n+1},k_c^{n+1}$を評価し、局所的に

$$
\xi^{n+1}
=\frac{\xi^n+\Delta t\,k_o^{n+1}}
{1+\Delta t(k_o^{n+1}+k_c^{n+1})}
$$

と消去する。この更新は$\xi^n\in[0,1]$なら$\xi^{n+1}\in[0,1]$を解析的に保つため、開口stateのclamp、圧deadband、事後projectionを要しない。

物理開口とloss計算用開口は

$$
A_{phys}=A_{leak}+\xi(A_{max}-A_{leak}),
\qquad
A_{eff}=\operatorname{hypot}(A_{phys},A_{num}),
$$

$$
A_{num}=0.003A_{max}
$$

と分ける。$A_{num}$は閉鎖時の係数発散を避ける数値正則化であり、生理的EROAでもfit parameterでもない。弁lossは

$$
R(\xi)=R_0\left(\frac{A_{ref}}{A_{eff}}\right)^2,
\qquad
B(\xi)=B_0\left(\frac{A_{ref}}{A_{eff}}\right)^2
$$

とし、$L$は開口stateで変えない。4弁の符号付きmomentum equationは

$$
L_j\dot Q_j
=\Delta P_j-R_j(\xi_j)Q_j
-B_j(\xi_j)Q_j\sqrt{Q_j^2+\varepsilon_Q^2}
$$

である。流れの運動エネルギーを$\mathcal K_j=L_jQ_j^2/2$とすると

$$
Q_j\Delta P_j
=\dot{\mathcal K}_j+\mathcal D_{flow,j},
\qquad
\mathcal D_{flow,j}
=R_j(\xi_j)Q_j^2
+B_j(\xi_j)Q_j^2\sqrt{Q_j^2+\varepsilon_Q^2}\ge0
$$

を満たす。逆流は大きな閉鎖lossを受ける符号付き流れとして残し、diodeで消さない。弁狭窄・逆流の病態軸は圧gainではなく、$A_{max}$、生理的$A_{leak}$、$R_0$、$B_0$、$L$、開閉時定数で表す。

この$\xi$は**散逸係数を変える低次開口state**であり、弁尖の質量、弾性、接触、腱索、乳頭筋、弁輪運動、渦、流体構造連成を表さない。$\xi$自身の保存エネルギーも主張しない。したがって流体系の非負散逸は監査できるが、弁尖を含む完全なmechanical-energy ledgerではない。Mynardらの動的弁モデルはこの低次クラスの生理的根拠を与えるが、上記smooth transitionと数値正則化の個々の係数をヒト弁で同定するものではない。

## 4. LA/RA one-fiber幾何

心房$A\in\{LA,RA\}$について、壁材積を$V_{w,A}$、血液容積を$V_A$とする。中壁包囲容積は

$$
V_{m,A}=V_A+\frac12V_{w,A}
$$

であり、無負荷reference cavity volumeを$V_{A,0}$とすると

$$
V_{m,A,0}=V_{A,0}+\frac12V_{w,A},
\qquad
e_{f,A}=\frac13\log\frac{V_{m,A}}{V_{m,A,0}}.
$$

仮想仕事

$$
P_A^{tm}\,\delta V_A
=V_{w,A}\tau_{f,A}\,\delta e_{f,A}
$$

より、心房transmural pressureは

$$
\boxed{
P_A^{tm}=\frac{V_{w,A}}{3V_{m,A}}\tau_{f,A}
}
$$

となる。圧gainは1に固定し、追加Laplace係数、残留圧offset、PV-loop補正項は置かない。

## 5. 心房平衡受動材料：Moyer 2015 exact equibiaxial reduction

### 5.1 3次元則からone-fiber pathへの縮約

MoyerらのヒトLA有限要素モデルで使われた非圧縮・横等方受動則を、等二軸shell path

$$
\mathbf F=\operatorname{diag}(\lambda,\lambda,\lambda^{-2}),
\qquad
\lambda=e^{e_f},
\qquad J=1
$$

へ縮約する。このpathでは

$$
I_1=2\lambda^2+\lambda^{-4},
\qquad
I_2=\lambda^4+2\lambda^{-2}.
$$

使用する係数は

$$
C_1=1.65\ \mathrm{kPa},\quad
C_2=0,\quad
C_3=0.015\ \mathrm{kPa},\quad
C_4=13.37.
$$

これらは独立したヒト心房組織試験の普遍parameterではなく、Moyer 2015のヒトLA organ-level FE構成から移したcandidate priorである。同論文の最終parameterはorgan model内の充満容積応答も参照して調整されているため、同じ種類の心房容積を再現しても独立validationにはならない。

線維はtension-onlyとし、$e_f>0$での単位reference volume当たりエネルギーを

$$
\begin{aligned}
\Psi_A(e_f)
={}&C_1\left(2e^{2e_f}+e^{-4e_f}-3\right)
+C_2\left(e^{4e_f}+2e^{-2e_f}-3\right)\\
&+C_3\left[
e^{-C_4}\left\{\operatorname{Ei}(C_4e^{e_f})
-\operatorname{Ei}(C_4)\right\}-e_f
\right]
\end{aligned}
$$

とする。$e_f\le0$では最後の線維項を0とし、matrix項が圧縮を受け持つ。

同じpotentialから

$$
\begin{aligned}
\tau_{\infty,A}
={}&4C_1\left(e^{2e_f}-e^{-4e_f}\right)
+4C_2\left(e^{4e_f}-e^{-2e_f}\right)\\
&+C_3\operatorname{expm1}
\left[C_4\left(e^{e_f}-1\right)\right]H(e_f)
\end{aligned}
$$

を得る。tangentは

$$
\begin{aligned}
K_A
={}&8C_1e^{2e_f}+16C_1e^{-4e_f}
+16C_2e^{4e_f}+8C_2e^{-2e_f}\\
&+C_3C_4e^{e_f}
\exp\left[C_4\left(e^{e_f}-1\right)\right]H_+(e_f)
\end{aligned}
$$

である。$H_+(0)$は引張側tangentを選ぶ実装規約である。支持範囲$e_f\in[-0.5,0.5]$では正のtangentを監査し、stress clampを使わない。

### 5.2 loaded CMR geometryの逆除荷

CMRで測られた最小心房容積は、圧が0の形状ではない。そこで、LA/RAそれぞれについて、観測最小容積$V_{A,min}$におけるprestrain$e_{A,min}>0$を

$$
\frac{V_{w,A}}{3(V_{A,min}+V_{w,A}/2)}
\tau_{\infty,A}(e_{A,min})
=P_{A,min}^{target}
$$

の単調な1変数rootとして求める。使用する圧anchorは

$$
P_{LA,min}^{target}=5\ \mathrm{mmHg},
\qquad
P_{RA,min}^{target}=3.5\ \mathrm{mmHg}
$$

である。無負荷reference cavity volumeは

$$
V_{A,0}
=\left(V_{A,min}+\frac12V_{w,A}\right)e^{-3e_{A,min}}
-\frac12V_{w,A}
$$

から決まる。

LAの5 mmHgはMoyer FE構成の外圧0を前提にtransmural anchorとして解釈する。RAの3.5 mmHgはWesselsらのcontrol群x-descent中央値2.0 mmHg（IQR 0.4–3.5）の上側IQRを採ったconstruction anchorであり、代表中央値でも、直接測定されたtransmural pressureでもない。現normal constructionでは外圧0として両者を対応させるが、この対応自体を独立な生理測定とは主張しない。RAの逆除荷を中央値2.0 mmHgへ変更する場合は、別candidateとして再構成し、現在のRA波形を保持するための後付けgainは使わない。

LAとRAは同じMoyer材料を共有するが、$V_{A,0}$は別々に逆同定する。これにより、LA/RA差を壁別圧gainではなく、観測解剖と無負荷reference volumeの差として表す。

center constructionの逆除荷結果は、LAで$e_{min}\approx0.1019,\ V_{LA,0}\approx22.89$ mL、RAで$e_{min}\approx0.0956,\ V_{RA,0}\approx32.60$ mLである。これらは固定した解剖・材料・最小圧からの派生量であり、独立に自由fitするparameterではない。

### 5.3 解剖anchorとhold-out

BSA $1.9\ \mathrm{m^2}$のcenter constructionでは、Li 2017 CMRから

| 心房 | 最大容積 | pre-A容積 | 最小容積 |
|---|---:|---:|---:|
| LA | 80.18 mL | 57.95 mL | 35.72 mL |
| RA | 98.04 mL | 72.58 mL | 47.31 mL |

を得る。壁材積は、LA mass、total atrial mass、心筋密度から構成する。centerの概算はLA $25.98$ mL、RA $23.40$ mLである。

同定に使うのは最小容積と最小圧だけであり、次はhold-outである。

- LA x-to-v reservoir pressure increment。
- LA filling-limb secant stiffness。
- RA v-wave pressure。
- LA/RA PVループの形、lobe面積、自己交差数。

center constructionの現在の受動readbackは、LA reservoir increment約$3.96$ mmHg、RA最大圧約$6.28$ mmHgである。ただし、Moyer parameter自体がorgan-model構成値であるため、これは完全に独立な生理validationではない。とくにRAへの適用はcross-atrium extrapolationである。

## 6. 独立受動SLS

各壁は、平衡受動材料と並列に1-state standard-linear-solidのMaxwell branchを持つ。内部変数を$\alpha_v$として

$$
q_v=E_v(e_f-\alpha_v),
\qquad
\dot\alpha_v=\frac{e_f-\alpha_v}{\tau_v}.
$$

保存エネルギーと散逸は

$$
\Psi_v=\frac12E_v(e_f-\alpha_v)^2,
$$

$$
\mathcal D_v
=q_v\dot\alpha_v
=\frac{q_v^2}{E_v\tau_v}\ge0.
$$

Backward Eulerでは$\alpha_v^{n+1}$を閉形式で消去し、物理散逸に加えて離散化散逸も非負になるpassivity identityを監査する。

SLSのmodulusは、並列に置かれる**同じ平衡材料**の明示されたreference tangentへ結び付ける。心房Moyer縮約では、旧実装が別のsynthetic central tangentを継承した結果、$E_v\approx175$ Paとなる一方、実際のtension-only Moyer経路の$e\to0^+$ tensile-side tangentは

$$
K_{Moyer,0}=39800.55\ \mathrm{Pa}
$$

であった。この構成則の取り違えを解消し、LA/RA共通の現candidateを

$$
E_{v,A}=r_AK_{Moyer,0}
=0.25\times39800.55
=9950.14\ \mathrm{Pa},
\qquad
\tau_A=0.05\ \mathrm{s}
$$

とする。これはLA/RAで同一のMoyer material ID、tangent source、$r_A$、$\tau_A$を共有し、壁ごとの自由fitを許さない。LVFW/SEP/RVFWは従来どおり各壁が共有する心室平衡材料のcompiled central tangentに$r_V=0.35,\ \tau_V=0.08$ sを適用する。

$K_{Moyer,0}$への再結合は、SLSを平衡材料と同じ応力scaleへ置く**parameter-provenance/scale整合化prior**であり、熱力学が要求する一意なmodulus選択ではない。圧縮側の$e\to0^-$ tangentは39600 Paで、ここではtensile-sideを採る。$r_A=0.25$または$\tau_A=50$ msがヒト心房の独立viscoelastic試験から同定されたことも意味しない。reference tangentは拍中のsecant/tangent stiffnessを一定に置き換えるものではない。$E_{v,A}$、$\tau_A$の更新に心房PVループ形状は使わない。

SLS-onはfull-model候補、SLS-offは因果ablationである。SLS-offで8の字ループを維持することは要求しない。病態fitでは、SLSをPV形状の修復項にせず、独立したrate-dependent stress/strainデータがある場合に限り$r_{class},\tau_v$を更新する。現値の生理同定が未完了である以上、SLSだけで同容積branch orderingを満たしてもモデル採択の十分条件にはしない。

## 7. Land active-only、no-series-element

### 7.1 能動状態と応力

全5壁でLand 2017 activeモデルを使用する。rate-free内部状態を概略

$$
\mathbf y_{Land}
=(CaTRPN,B,W,S,\xi_W,\xi_S)
$$

とし、

$$
\dot{\mathbf y}_{Land}
=\mathbf f_{Land}
(\mathbf y_{Land},Ca_i,\lambda_{Land})
$$

を解く。Land sourceのactive nominal stressは

$$
T_a
=\frac{h(\lambda_{Land})T_{ref}}{r_s}
\left[S(\zeta_S+1)+W\zeta_W\right]
$$

である。one-fiber壁の仕事共役なKirchhoff stressへ

$$
\tau_{Land}
=\lambda_{Land}\,\chi_{orient}\,f_{viable}\,T_a
$$

と変換する。現在のnormal candidateでは$\chi_{orient}=1$であり、自由gainを許さない。

ここで`rate-free`という名称は、力–速度履歴を消したことを意味しない。Land sourceのdistortion state $\zeta_i$（$i\in\{W,S\}$）が

$$
\dot\zeta_i=A_i\dot\lambda_{Land}-c_i\zeta_i
$$

に従うとき、実装stateを

$$
\xi_i=\zeta_i-A_i\lambda_{Land}
$$

へ置けば

$$
\dot\xi_i=-c_i(\xi_i+A_i\lambda_{Land}),
\qquad
\zeta_i=\xi_i+A_i\lambda_{Land}
$$

となる。$\xi$のODEから明示的な$\dot\lambda_{Land}$は消えるが、stress評価で$\zeta$を再構成するため、連続系でもBackward Euler離散系でもsource式と代数的に同一である。したがって、旧`rate-free`実装そのものはforce–velocity couplingを除去しておらず、global chamber strain-rateに由来するactive stress履歴を完全に保持していた。

LA/RAのcanonical構成では、この厳密座標変換とは別に、**organ-scale population-only reduction**を採用する。one-fiber心房の$\lambda_{Land}$は全心房容積から得る平均量であり、弁輪運動、非自己相似変形、局所線維recruitmentを解像しない。その$\dot\lambda_{Land}$を測定済みsarcomere shortening rateとみなす根拠がないため、心房だけ

$$
A_{eff}=0
\quad\Longrightarrow\quad
A_W=A_S=0
$$

とする。$CaTRPN,B,W,S$のpopulation kineticsとLewalle由来force scaleは保持するが、global atrial volume-rateからmicroscopic distortion forceを生成しない。既存solverとの同一layout比較のため$\xi_W,\xi_S$ slotは一時的に残るものの、zero-distortion manifoldへ減衰するdormant compatibility stateである。この多様体上ではdistortion-stress寄与を持たないが、$A_{eff}=0$だけで任意の非零$\xi_W,\xi_S$がstress-inertになるわけではない。これはseries elementを加える操作ではなく、series elementは引き続き存在しない。

旧source-distortionを保持するarmは、受動材料、SLS、calcium、$T_{ref}$、循環、弁を固定した**causal control**としてのみ残す。このcontrolで`rate-free` $\xi$を用いても上記のとおりsource Landと完全同値である。従ってcanonical armとの差は座標表現ではなく、$A_{eff}$を介したglobal-volume-rate distortion closureの有無へ一意に帰属できる。心室Landの$A_{eff}$とforce–velocity couplingは変更しない。

### 7.2 parameterの責任境界

LVFW/SEP/RVFWはLand 2017 intact-human 37℃ kineticsを保ち、同論文Appendix Bのwhole-organ columnにある

$$
T_{ref}=120\ \mathrm{kPa}
$$

を使う。40.5 kPa cellular columnからの変更は明示的なorgan-scale選択であり、Ca振幅、viability、壁別gainに隠さない。

LA/RAは、Land–Niedererのatrial kinetics構成を共有する。ただし、旧candidateの

$$
T_{ref}=40.5\ \mathrm{kPa}
$$

は心室skinned-cell source値であり、心房固有の収縮振幅ではない。そこで、Lewalleらが37 ℃、ヒトLA permeabilized fiber、pCa 4.5で報告した中央最大能動張力

$$
T_{LA,max}=11.6\ \mathrm{kPa}
$$

を、$lambda_{Land}=1$における現6-state Land定常解へ写像する。定常stress比は

$$
\gamma_{sat}
=\left.\frac{T_a}{T_{ref}}\right|_{mathrm{pCa}=4.5,\lambda=1}
=0.9947560056040118
$$

なので、実装するreference tensionは

$$
T_{ref,A}
=\frac{11.6\ \mathrm{kPa}}{\gamma_{sat}}
=11.66115101055\ \mathrm{kPa}
$$

である。これはPV loopを見て合わせたgainではなく、独立ヒトLA組織force scaleを現方程式へ変換したcandidate priorである。LA/RAは同一parameter objectを共有し、RAへの適用はLA evidenceからのtissue-class extrapolationと明示する。Moyer 2015の$T_{max}=10$ kPaはorgan FE内でactive emptyingに合わせて選択された別構成則の値なので、Land $T_{ref}$へ直接移さない。

force-scale source parameter setでは、Lewalle写像により触るprimitiveは$T_{ref}$だけであり、$CaT50$、$k_{ws}$、$k_{wu}$、$k_{su}$、$\beta_0$、$\beta_1$などはbit-exactに保持する。canonical runtime setはさらに、上記organ-scale closureとして$A_{eff}$だけを0にし、派生する$A_W,A_S$だけを0にする。これはヒト心房force–velocity parameterの同定ではない。source-distortion controlは$A_{eff}$を元値に戻し、それ以外を同一に保つ。

従って、心房active振幅、population kinetics、global-volume-rate distortionを同時に自由調整しない。Lewalleらの長さ依存性と$k_{tr}$は独立component gateとし、異なる$B_{off}/U_{off}$ stateとforce-dependent OFF–ON feedbackを持つ同論文のmicroscopic parameter vectorを6-state Landへ移植しない。

### 7.3 prescribed calciumの責任境界

prescribed calciumは保存されたCa cycling modelではなく、各電気activation eventで駆動される2指数差

$$
c(t)=c_d+A_c\frac{e^{-t/\tau_d}-e^{-t/\tau_r}}{N},
\qquad 0<\tau_r<\tau_d
$$

である。normal candidateでは、壁別調整をせず、心房classと心室classにそれぞれ1組だけ持つ。

| runtime/ablation | $\tau_r$ | $\tau_d$ | $c_d$ | $A_c$ | 位置づけ |
|---|---:|---:|---:|---:|---|
| Mazhar-timing-bounded V2 LA/RA | 20 ms | 215 ms | 0.10 µM | 0.50 µM | Mazhar 2024 Table 2の37 ℃ヒト心房Ca **timingだけ**へ対応する二重指数candidate |
| V4 LVFW/SEP/RVFW | 30 ms | 120 ms | 0.11 µM | 0.89 µM | 既存project-synthetic priorを保持し、心房変更との因果を分離 |
| V5 ventricular-Ca ablation | 70 ms | 110 ms | 0.11 µM | 0.89 µM | TTP約171 ms、RT50約122 ms、RT90約224 ms |

心房V2の未scale二重指数は、Ca eventからpeakまで52.3697 ms、peak後50% relaxationまで170.01 ms、eventから10%残存まで568.42 msである。MazharらのTable 2に集約された37 ℃ヒト心房範囲は、それぞれ49.4–55.6 ms、168.5–186.5 ms、508.1–570.1 msであり、V2はこの**timingだけ**をcandidate priorとして使う。最後の値はonset-to-10%というTT90 surrogateであり、文献の$TT_{Ca}$と同一定義だとは主張しない。電気activationからCa eventまでのdelayは12 msである。

Mazharらの値は複数実験sourceを統合したhuman atrial cardiomyocyte modelの入力contextであり、現二重指数を直接digitizeした単一の測定traceではない。また、$c_d=0.10\ \mu\mathrm M$と$A_c=0.50\ \mu\mathrm M$はLand–Niederer contextを保持した値で、Mazhar Table 2から絶対振幅を同定したものではない。同Tableの集約範囲（diastolic Ca 0.20–0.25 µM、CaT amplitude 0.18–0.40 µM）からも外れる。従ってV2は`human-atrial-calcium-amplitude-identified`を主張せず、Mazhar-timing-bounded candidateとのみ呼び、閉ループ採択も未確立とする。

心室にもLand/Coppini context（TTP 171 ms、RT50 122 ms）を再構成する候補は作るが、RT90は文献contextの281 msを再現せず約224 msである。しかも旧closed-loopでもCa eventからLV圧peakまでの遅延は概ね160 msであり、心房変更と同時に心室Caを変える必然性はない。したがってcanonical candidateは旧心室Caを保持し、新心室CaはV5 causal ablationだけに隔離する。2指数形で3つのtiming metricを同時に満たせない場合はtau探索を続けず、一次波形に基づく最小の別Ca classを比較する。Ca波形とLand kineticsを患者fitで同時に自由化することも避ける。

心房・心室とも、活性化時刻とprescribed calcium forcingは能動収縮ownerであり、平衡受動材料やSLSで収縮力を補わない。

Landへ巨視的series elementは追加しない。ここでいうno-series-elementは、独立SLSを消す意味ではない。SLSは平衡材料と並列の受動粘弾性であり、Land crossbridgeと直列につないだ長さ分配自由度ではない。

## 8. LV/RV one-fiber + finite-thickness energy-conjugate TriSeg

### 8.1 3壁spherical-cap幾何

TriSegはLV free wall、septum、RV free wallを3つの有限厚spherical segmentとして結合する。各壁$p\in\{LVFW,SEP,RVFW\}$のsigned midwall cap volumeを$V_{m,p}$、junction radiusを$y_m$、signed cap heightを$x_{m,p}$とする。

$$
A_{m,p}=\pi(x_{m,p}^2+y_m^2),
\qquad
C_{m,p}=\frac{2x_{m,p}}{x_{m,p}^2+y_m^2}.
$$

有限厚補正を含むfiber log strainは

$$
e_{f,p}
=\frac12\log\frac{A_{m,p}}{A_{m,ref,p}}
-\frac{z_p^2}{12}-0.019z_p^4,
$$

$$
z_p=\frac32C_{m,p}\frac{V_{w,p}}{A_{m,p}}.
$$

cap volumeの符号とLV/RV cavity volumeとの関係はLumens 2009 conventionを保持する。

### 8.2 心室平衡受動材料

心室のeffective one-fiber平衡材料は、引張域で

$$
\Psi_{t}(e_f)
=\frac{A}{B^2}\left(e^{Be_f}-1-Be_f\right),
$$

$$
\tau_t(e_f)=\frac{A}{B}\left(e^{Be_f}-1\right),
\qquad
K_t(e_f)=Ae^{Be_f}
$$

とする。圧縮域は

$$
\Psi_c(e_f)=\frac12K_{comp}e_f^2,
\qquad
\tau_c=K_{comp}e_f
$$

であり、$|e_f|<10^{-3}$ではenergy、stress、tangentを一致させるconvex quintic transitionを使う。

Klotz EDPVRで同定する自由度は、3心室壁に共通の**引張energy scale 1個**だけである。$A$をscaleするとき、energy、stress、tangentを同じ倍率で変える。$B$、圧縮modulus、SLS、Land、pericardium、心腔圧gain、壁別scaleは同定しない。

### 8.3 frozen-state potentialと一般化力

内部材料状態を固定した瞬間のmembrane virtual workを

$$
\delta\Pi_m
=\sum_pV_{w,p}\tau_{f,p}\,\delta e_{f,p}
$$

とする。したがって一般化座標$q_j$に対する力は

$$
G_{m,j}
=\sum_pV_{w,p}\tau_{f,p}
\frac{\partial e_{f,p}}{\partial q_j}.
$$

負のmembrane stressもそのまま保持し、stress clampを使わない。

### 8.4 Koiter曲げenergy

有限厚shellが形状foldを無拘束に通過するのを避けるため、数値shape springではなく、moment-free reference curvature $C_{0,p}$を持つKoiter曲げenergyを加える。reference thicknessとplate rigidityは

$$
h_{0,p}=\frac{V_{w,p}}{A_{m,ref,p}},
$$

$$
D_p=\frac{E_bh_{0,p}^3}{12(1-\nu^2)}.
$$

spherical trace-curvatureに対するreduced rigidityを

$$
B_p=\frac{1+\nu}{2}D_p
$$

とし、

$$
\Psi_{b,p}
=\frac12B_pA_{m,ref,p}(C_{m,p}-C_{0,p})^2
$$

を用いる。現normal candidateは$E_b=3$ kPa、$\nu=0.45$、全壁multiplier 1である。$E_b$は0.3–30 kPaの広いsensitivity rangeのlog midpointとして置いたconstruction priorであり、KlotzまたはPV loopから同定していない。

### 8.5 cavity pressureと形状平衡

membraneとbendingを合わせたpotentialの微分を

$$
P_L^{tm}=\frac{\partial\Pi}{\partial V_L},
\qquad
P_R^{tm}=\frac{\partial\Pi}{\partial V_R},
$$

$$
G_{V_S}=\frac{\partial\Pi}{\partial V_{m,S}},
\qquad
G_y=\frac{\partial\Pi}{\partial y_m}
$$

と定義する。内部平衡は実装上のscaleに合わせて

$$
r_{axial}=\frac12y_mG_{V_S}=0,
\qquad
r_{radial}=\frac{G_y}{2\pi y_m}=0
$$

で解く。

Lumens 2009のpublished Taylor assemblyは比較diagnosticとして残すが、mechanistic rebuildのruntime pressureまたはroot ownerには使わない。Taylor defectをenergy balanceから差し引いて新しいassemblyを正当化することもしない。

## 9. 解剖と受動較正

### 9.1 心室CMR anchor

BSA $1.9\ \mathrm{m^2}$のcenter constructionは、pooled adult CMRから

| 量 | LV | RV |
|---|---:|---:|
| EDV | 144.4 mL | 155.8 mL |
| ESV | 53.2 mL | 66.5 mL |
| mass | 108.3 g（septumを含む） | 38.0 g（RV free wall） |

を参照する。このうちEDVとmassをgeometry/material constructionへ使い、ESVは収縮後のheld-out正常population targetとして使う。ESVから収縮力またはreference geometryを逆fitしない。LV massはseptumを一度だけ所有し、Lumens 2009の初期wall-volume比をpartition priorとしてLVFWとSEPへ分ける。心筋密度$1.053\ \mathrm{g/mL}$でwall material volumeへ変換する。

centerのwall material volumeは概ね

$$
V_{w,LVFW}=67.08\ \mathrm{mL},\quad
V_{w,SEP}=35.77\ \mathrm{mL},\quad
V_{w,RVFW}=36.09\ \mathrm{mL}.
$$

CMR ED geometryはloaded geometryであり、reference areaへ直接コピーしない。全3壁のED geometry stretchをconstruction prior $\lambda_{ED}=1.1$と置き、有限厚ひずみ式を逆に解いて$A_{m,ref,p}$を得る。この$1.1$は直接測定値ではない。

### 9.2 Klotz EDPVRの使い方

LV construction anchor $(V_{ED},P_{ED})=(144.4\ \mathrm{mL},8\ \mathrm{mmHg})$からKlotz normalized EDPVRを構成する。複数のinflation volumeで、各trialの共通引張scaleごとにfinite-thickness TriSeg内部平衡を解き直す。

同定に使うのはED anchor 1点であり、他のinflation nodesはmultipoint replayである。各nodeで

- active stress = 0。
- SLS overstress = 0。
- pericardial pressure = 0。
- 3壁がpure-tension branch内。
- finite-thickness energy rootがstrict local minimum。

を要求する。

Klotzはgroup-level LV EDPVRであり、心筋材料そのものではない。RV volumeはCMR EDのRV/LV比を保つ同時inflation pathであり、RV EDPVRがKlotzによりvalidationされたことを意味しない。

## 10. common pericardiumと絶対圧

心膜内総容積を

$$
V_h=V_{LA}+V_{LV}+V_{RA}+V_{RV}
+\sum_{w\in\mathcal W}V_{w}
$$

とする。$x=V_h/V_{h,0}-1$にC2のsmooth positive part$\phi_\delta(x)$を適用し、common pericardial pressureを

$$
P_{peri}
=P_{eff}
+P_0\left[\exp(k\phi_\delta)-1\right]\phi_\delta'(x)
$$

とする。対応するenergyは

$$
\Psi_{peri}
=P_{eff}(V_h-V_{h,0})
+\frac{P_0V_{h,0}}{k}
\left[\exp(k\phi_\delta)-1-k\phi_\delta\right].
$$

$P_{peri}$は全4心腔へ同じ外圧として加わる。絶対圧は

$$
P_c^{abs}=P_c^{tm}+P_{thorax}+P_{peri}.
$$

research model factoryは、mechanics proxyの$P_{thorax}$とmain-wire血管外圧の`pth`が同じことを要求し、不一致はfail-closedにする。現normal runnerが構成するmechanics proxyは$P_{thorax}=0$に固定されるため、CLIの非zero胸腔圧だけで血管側をずらすことは許可しない。呼吸・胸腔圧病態は、mechanicsと血管を同じ外圧ownerから再構成する別variantとして接続する。

normal candidateの$V_{h,0}$は、CMR最大心房容積、CMR心室EDV、壁材積の和に5% reserveを持たせて構成する。心膜は血圧を上げるfit knobではなく、心膜内容積過大時の共通constraintである。

## 11. pre-A constructionと周期軌道の責任分離

### 11.1 pre-A心臓rootとmain-wire血管TBV root

初期化は「心房activationがまだなく、拡張末期のdiastasisにあるconstruction seed」で行う。これはschedule上の心房calcium drive直前そのものではない。現在のcycle originからRA driveまでは12 ms、LA driveまでは42 msあり、各心房の真のpre-activation量はそれぞれのevent直前sampleで別に評価する。post-A LVEDPや平均LAPをconstruction seedの一点圧targetとして使わない。

未知数は

$$
\mathbf u=
(V_{LA},V_{LV},V_{RA},V_{RV},V_{m,S},y_m,p_{fill})
$$

の7個である。残差は

1. TriSeg axial/radial equilibrium 2本。
2. LA/LV/RA/RV absolute pressure replay 4本。
3. total blood volume closure 1本。

の計7本である。このrootは心臓壁、TriSeg、4心腔の圧・容積を整合させるmechanics seedを作る。新しい分布循環へ渡す際、ここに含まれる旧4血管aggregateの容積・入口流・履歴は一切importしない。

血管$V_0$とcomplianceは固定し、全区画圧shapeに共通offset$p_{fill}$だけを加える。現在のconstruction pressure shapeは概ね

| 区画 | 圧 |
|---|---:|
| LA / LV | 7.5 / 5.0 mmHg |
| SA / SV | 90 / 7 mmHg |
| RA | 5.3 mmHg |
| RV | LV 5 mmHgのKlotz volumeにおけるcoupled finite-thickness TriSegの受動予測（正常candidateでは概ね1–2 mmHg） |
| PA / PV | 14 / 8.5 mmHg |

である。RV圧を独立に固定すると、LVで校正した同一受動エネルギー面と矛盾してRVを過膨張させ得る。そのため、LVのpost-A EDPVR校正anchor 8 mmHgとは別に、LV pre-A target 5 mmHgに対応するKlotz volumeを求め、CMR EDV比を保ったbiventricular loading path上で有限厚TriSeg equilibriumを解き、RV圧を予測する。このRV値はRV Klotz targetでもPV形状fitでもない。残る圧shapeも一意な正常ヒト同定ではなく、弁時相と循環poolを整合させるconstruction priorである。

心臓seedの従来constructionでは、総血液量5.6 LをHeldt 2002のlumped model分布

$$
SA:SV:pulmonary:heart=15:69:9:7\ \%
$$

へ分けるpriorを使っていた。これは個人計測値ではなく、新しいmain-wire血管状態のownerでもない。

続いて、4心腔の容積と絶対圧を固定境界として、main-wire 11血管区画を別に初期化する。未知数は共通の非負順行構成流量$q_0$だけである。RAから体循環を、LAから肺循環をedge圧損に沿って上流へ再帰し、各node圧をmain-wire PV逆写像で容積へ変換する。$q_0$は

$$
\sum_{c\in\mathcal C}V_c(q_0)-V_{blood}=0
$$

の決定論的bracket+bisectionで解く。これにより、11血管edgeすべての圧損残差、11血管容積、5.6 L TBVを同時に閉じる。代表normal seedの$q_0$は約71.47 mL/sだが、これはCO targetでもfit値でもない。$q_0$を得た後に$V_u$、compliance、抵抗、TBVを動かさない。

`Ao_SA`と`PA_PArt`は$q_0$で初期化する。4弁flowはmechanics seedから連続的に引き継ぐため、全15区画の$\dot V=0$までは要求しない。LandとSLSはcardiac pre-A constructionの段階で新しい解剖・幾何に対して初期化済みであり、main-wire transformerはそのCa/Land/SLS状態を値を変えず厳密に保持する。旧aggregate血管の容積・入口流だけを捨て、handoff時に心筋履歴をもう一度再初期化しない。

このpre-A解が保証するのは**構成整合なrelaxed seed**だけであり、period-1、生理作動点、左右拍出量一致を保証しない。

### 11.2 exploratory repeated cycleと将来のformal fixed-point acceptance

周期解はcycle map

$$
\mathbf x_{n+1}=\Phi_T(\mathbf x_n)
$$

を繰り返し適用して求める。pre-A seedを1拍積分し、そのendpointを次拍のinitial stateに渡す。

現在のmain-wire distributed runnerは、指定拍数（既定1拍）だけ同じcycle mapを反復し、complete-state endpoint distance、TBV drift、各拍の波形要約を探索的に報告する。nominal intervalが収束しない場合に限り、`retryableByStepSubdivision=true`のtrial-domainまたは非線形収束failureを二分する。これはadaptive step recoveryであって固定$\Delta t$ evidenceではない。各拍と全runについて、`acceptedTimeStepSec.minimum/maximum`、`solverRetrySubdivisionCount`、`maximumRetryDepthUsed`、`adaptiveRetrySubdivisionApplied`を保存する。`modelOrConstitutiveFallbackApplied=false`は構成則や循環modelを別物へ切り替えていないことだけを意味し、時間区間の二分をしていないことは意味しない。artifactはretryの有無にかかわらず`fixedTimeStepIntegrationClaimed=false`を固定する。invariant、programming、accepted-state domain failureは二分retryせず終了する。これは周期判定器ではなく、artifactもformal period-1を確立しないことをclaim boundaryで明示する。旧8区画比較経路にあるperiodic continuation、committed ledger、whole-cycle energy acceptanceを、新しい15区画経路が実行したものとして流用しない。

main-wire candidateをformal acceptanceへ昇格させる前に接続すべきprotocolは

- 最初の5拍をwarm-upとして捨てる。
- 6拍目以降にcomplete-state normalized endpoint distance

$$
d_n=\|\mathbf x_{n+1}-\mathbf x_n\|_{scaled,\infty}<10^{-6}
$$

を要求する。
- 左右心拍出量不一致率

$$
\epsilon_{CO}
=\frac{|CO_L-CO_R|}
{\tfrac12(|CO_L|+|CO_R|)}<0.05
$$

を要求する。
- 15本すべてのedgeで正味平均流が順行性で、その平均流量間の最大相対不一致を5%未満とする。
- 各拍のTBV conservation、全区画closure、runtime-resolvedかつ拍内固定のNewton scale、Land simplex、vascular PV domain margin、SLS離散passivity、projection/clamp/model fallbackなしを含むcommitted-interval ledger gateを要求する。formal fixed-step evidenceではretry depthを0に固定し、全accepted intervalが指定$\Delta t$（event alignmentによる既知の短縮区間を除く）であることを別途監査する。現artifactの`fixedTimeStepIntegrationClaimed=false`を、retry回数が0だったという理由だけで上書きしない。
- 隣接endpointだけでなく、3拍streakの始点から終点までのcomplete-state距離も$10^{-6}$未満とする。これにより、小さな単調driftの偽収束を防ぐ。
- 全gateを3拍連続で満たして収束とする。
- 最大30拍に達しても未収束ならfail-closedとする。
- 1拍だけでperiodic orbitを主張しない。

標準の4 ms実行はvisual exploration用であり、formal periodic evidenceではない。将来のformal対象では少なくとも1/0.5/0.25 msのtime-step convergenceを要求し、whole-cycle energy acceptanceはさらに0.25 msで確認する。4 msでsettleしても、その結果には`exploratory-settled`以上のラベルを与えない。

探索runnerの反復自体は単純なcycle-map iterationであり、高次元Newton shootingは未使用である。formal protocolを実装するときも、まず同じ反復とfail-closed gateを採用し、必要になればcomplete-stateとhemodynamic gateを変えずにmatrix-free shooting/Anderson型へ交換する。

## 12. 数値積分、energy、passivity gate

### 12.1 同一時刻レベル

壁、TriSeg、心膜、血管圧、弁flowを同じendpoint時刻で評価し、monolithic Backward Eulerで解く。既知のcalcium event forcingを除き、圧・流・壁応力を異なる時刻から混ぜない。

動的弁開口を含むmain-wire candidateの保存微分状態数は、SLS-on/offでそれぞれ

$$
15\ V+6\ Q+4\ \xi_{valve}+10\ Ca+30\ Land+5/0\ SLS=70/65
$$

である。既知のexact-event calcium 10状態はNewton未知数にしない。4弁の$\xi^{n+1}$もendpoint圧から上記閉形式で局所消去し、別のNewton slotや残差を置かない。TriSeg 2座標を代数未知数に加えるため、Newton未知数・残差数は

$$
15\ V+6\ Q+30\ Land+5/0\ SLS+2\ TriSeg=58/53
$$

で一致する。SLS-offではplaceholderを残さない。

全5壁のmechanical powerに使うひずみ速度は、時刻sampleの中心差分を主値にせず、現在の幾何写像の解析chain ruleから求める。心房は

$$
\dot e_A=\frac{\partial e_A}{\partial V_A}\dot V_A,
$$

心室3壁は

$$
\dot e_p
=\frac{\partial e_p}{\partial V_{m,p}}\dot V_{m,p}
+\frac{\partial e_p}{\partial y_m}\dot y_m
$$

とし、signed spherical-capの符号と有限厚補正を含める。中心差分はcoarse/fineの独立auditにだけ残し、解析rateとの一致をgateする。これにより、壁power $V_{w,p}\tau_p\dot e_p$ と有限厚TriSegの一般化仕事率の差を、数値微分stepに依存する見かけの残差と分離する。

### 12.2 component監査と未接続のformal gate

main-wire distributed stepで現在fail-closedにしているのは、状態domain/finite、Newton残差、15区画TBV保存、TriSeg平衡、Land simplex、vascular PV上下限、SLS topology、projection/clamp/model fallback不使用である。Land simplex marginは無次元Land population制約だけから算出し、単位を持つvascular volume marginと混ぜない。LA/RAがpopulation-only構成なら、previous/accepted endpointの$|\xi_W|,|\xi_S|$がroundoff幅（$1024\epsilon_{mach}$）を越えてzero-distortion manifoldを離れた時点でprojectionせずfail-closedにする。recoverable trial-domain、recoverable nonlinear convergence、terminal model evaluation、terminal accepted-state evaluationを分離し、外側runnerは明示的にretry可能な前二者だけを二分する。構成要素testでは、さらに次を独立に監査する。

- 全状態と全導関数がfinite。
- 血液量closure。
- TriSeg axial/radial residual。
- passive energy、stress、tangentの微分整合。
- finite-thickness generalized forceとpotential finite differenceの一致。
- mixed shape derivativeの対称性。
- Koiter referenceで曲げenergy/forceが0。
- Land nominal-to-Kirchhoff adapterの相対仕事誤差$<10^{-12}$。
- finite-thickness TriSeg normalized work-conjugacy residual$<10^{-8}$。
- 各flowの散逸$\ge0$。
- SLSの物理・数値散逸$\ge0$。
- 旧aggregate経路のaccepted stage ledger normalized residual$<10^{-5}$。
- 旧aggregate経路の0.25 ms単一cycle energy diagnosticでnormalized residual$<10^{-3}$。

後二つのledger/whole-cycle thresholdは新しい15区画runnerへまだ接続しておらず、distributed acceptanceの実装済みgateとして数えない。接続時には、旧aggregate血管のenergyを再利用せず、main-wire 11血管PV energy、6 inertial flow、9 algebraic dissipationを同一endpoint ledgerへ明示的に入れる。これらのthreshold自体も、すべてのdt、全beat、全病態での収束を証明するものではない。Backward Eulerの全体系energy acceptance、time-step convergence、ATP chemical energy、mechanical efficiencyは現phaseの主張外である。

## 13. fitting階層と病態表現

病態fitでは、観測量に最も近い任意parameterを動かすのではなく、原因階層に沿ってparameter群を開く。

| 病態・観測 | 第一選択のmechanistic axis | 同時に固定・監査するもの |
|---|---|---|
| 心房拡大、AF remodeling | LA/RA loaded phasic volumes、wall mass、unloaded reference volume、activation | PV形状だけでMoyer係数を変更しない |
| 心房線維化・硬化 | Moyer matrix/fiber係数、SLS class parameter | reservoir pulse、secant、strain-rateデータを別軸で使う |
| LV hypertrophy/dilation | CMR cavity volume、LVFW/SEP mass、reference area | septumを二重計上しない |
| RV pressure/volume overload | RV cavity/mass、pulmonary afterload | TriSeg septal geometryをhold-outにする |
| HFpEF | ventricular tensile law、reference geometry、血液量/静脈容量 | EDPVRと心膜を混同しない |
| HFrEF | shared ventricular Land $T_{ref}$またはCa transient | EDPVRを収縮力補正に使わない |
| dyssynchrony/BBB | LVFW/SEP/RVFW activation timing | wall-wise gainで時相差を代替しない |
| AF/atrial standstill | atrial activation timing・振幅、構造remodeling | SLSでa-waveを作らない |
| 弁狭窄 | $A_{open}$、loss/inertance geometry | upstream contractilityとの識別を確認 |
| 弁逆流 | physiological EROA | numerical reverse areaを病態parameterにしない |
| systemic hypertension | $R_{sys}$、SA compliance、必要ならvascular remodeling | Land gainだけで後負荷を表現しない |
| pulmonary hypertension | $R_{pul}$、PA compliance、RV/SEP remodeling | LV/RV interactionを保持する |
| volume depletion/overload | TBV、固定$V_0$下のstressed volume | TBV変更ごとに$V_0$を再fitしない |
| pericardial effusion/constriction | $P_{eff}$、$V_{h,0}$、pericardial stiffness | chamber別pressure offsetを入れない |

### 13.1 推奨する階層型同定順序

1. BSA、CMR/echo cavity volume、wall massから解剖を固定する。
2. 血圧、CO、TBV、血管volumeから循環poolと$R/C/V_0$を固定する。
3. EDPVRまたはdiastolic pressure-strainから平衡受動則を同定する。
4. rate-dependent stress/strainからSLSを同定する。
5. systolic pressure、EF、strain、ejection durationからLand/Caを同定する。
6. Doppler/valve imagingから弁areaとlossを同定する。
7. architectureとparameterを事前固定した将来caseでは、最後にPV loop、静脈flow、septal motionをhold-out全体系観測として確認する。現candidateのPV loopは既にarchitecture選択へinformされたdevelopment diagnosticなので例外である。

parameter identifiabilityが不足する場合は、壁別自由parameterを増やす前に、階層priorとpopulation分布を導入する。異なる物理ownerのparameterで同じ波形を相殺するfitは採用しない。

### 13.2 topology変更が必要な病態

ASD/VSD、PDA、Fontan、mechanical support、regional infarct、明示的annular tetheringなどは、現在の15区画・5壁parameter変更だけでは表せない。これらはshunt edge、device、regional wall、または新しい仕事共役座標を追加するtopology extensionとして扱う。冠循環もmain-wireに存在するが、現non-coronary candidateへ暗黙に混ぜず、冠血流と心筋内外圧のenergy boundaryを定義した次のtopology extensionで接続する。

## 14. AVPD、MAPSE、TAPSE、s'、a'

AV-plane変位$z_M$をcoreへ加え、

$$
M_z\ddot z_M+C_z\dot z_M+
\frac{\partial\Psi_z}{\partial z_M}
=F_{z_M}^{wall}
$$

を解く案は現phaseでは採用しない。独立な長軸幾何・弁輪力データがない状態では、収縮期のx谷を下げる一方、拡張期に逆向きの力が心房へ戻り、conduit pathを不自然に押し上げる自由度になるためである。

設計方針は次である。

- AVPDをcoreのpressure-generating stateにしない。
- 将来、心尖–弁輪軸と壁幾何からobserverとして算出する。
- observerは循環・壁力学へfeedbackしない。
- 現one-fiber幾何には一意な長軸弁輪座標がないため、現在のAVPD/MAPSE/TAPSE/s'/a'は`unavailable`とし、捏造しない。
- observerが必要な精度を出せないと実証されたときだけ、3次元縮約と仕事共役性を持つdynamic AV-planeを競合topologyとして再検討する。

## 15. acceptanceの順序

正常candidateの正式評価順は次とする。これは採択順序の仕様であり、現在のexploratory distributed runnerが3以降を実装・通過済みという意味ではない。

1. 構成則domain、finite、mass/volume closure。
2. pre-A rootの圧replay、TriSeg equilibrium、TBV closure。
3. period-1 complete-state/streak-window convergence、15 edge平均流一致、左右CO一致、committed ledger gate。
4. SA/PA/心房平均圧、CO、LV/RV EDV/ESV/EF、および最初の心室Ca drive直前のcommitted left-limit LVEDP。
5. 4弁の開閉時相、正味順行量、逆流量、圧較差。
6. E/A、TV inflow、PV/VC flow、ejection duration。
7. LA/RA PV loop、reservoir/conduit/booster分解、septal motion。

PV形状を先に合わせて1–6の誤りを隠すことは禁止する。とくに、LV EDV/ESVが過大なときは、最初にpre-A cardiac pool、LA/RA booster volume、periodicity、Klotz replayを分解し、直ちにLand $T_{ref}$や弁areaを動かさない。

歴史的にheld-outとして実装された心房PV読出しは、最大の正味順行MV/TV lobeから弁opening/closureを決める。reservoir branchはclosure後の局所最小容積からopening前最大容積まで、early-conduit branchはopeningから最初のpost-opening局所最小容積までとする。同じ容積上のreservoir-minus-conduit圧差を報告する。この読出し値をconstructorまたは連続parameterの数値目的関数には渡さないが、本V2 architectureの選択は旧closed-loopのbranch inversionとhook診断に明示的にinformされている。従って本candidateに対しては**development diagnosticであり、独立held-out validationではない**。formal period-1が成立した場合に限り、観測された閉曲線のshoelace面積または$\oint P\,dV$を生理的loop workの候補として扱う。現在のexploratory拍は始点と終点を直線chordで閉じた幾何診断だけを報告し、これは生理的loop workではない。

弁開放中ずっと心房容積が単調減少することは要求しない。肺静脈・大静脈からの流入が房室流を上回れば、diastasisや心房収縮前に小さい再充満が生じ得るからである。一方、early-conduitで空になった量に対するその後の最大再充満量

$$
r_{refill}
=\frac{\max_{t>t_{min},\,Q_{AV}>0}[V_A(t)-V_A(t_{min})]}
{V_A(t_{open})-V_A(t_{min})}
$$

を診断値として分離する。旧単一PV lumpでLAはこの比が約1.30、RAは約0.09であり、LAだけが拡張早期emptyingをほぼ相殺していた。これは合否targetとしてfitする値ではなく、`PVein_LA`流入、MV流出、LV弛緩、肺静脈storageを因果分解するための指標である。

非period-1拍で最大AV正流量lobeが拍境界をまたぐ場合、拍末状態と拍頭状態を周期的に同一視してはならない。その場合のlate-refill読出しは観測拍末でright-censorし、次拍のfunctional closureまでを推定しない。exact openingでは$Q_{AV}=0$なので、静脈流入$Q_{ven}>0$なら連続性

$$
\dot V_A=Q_{ven}-Q_{AV}
$$

からopening直後のごく短い容積増加は必ずしも異常ではない。問題にするのは、房室流が十分立ち上がったearly-conduitで$Q_{ven}>Q_{AV}$が再出現してemptyingを大きく相殺する場合である。この区別をせず「弁開放後は全点で単調減少」を課すことは、肺静脈流入または弁の有限な立ち上がりを非物理的に消すため採用しない。

terminal拍では、この因果分解を形状だけでなく連続式から監査するため、LA/RAの`terminalAtrialPostOpeningMassBalanceDiagnostic`も保存する。区間はfunctional AV opening $t_{open}$から観測拍末$T$までであり、period-1を仮定して次拍のclosureへ延長しないright-censored区間である。流れの対応は

$$
(Q_{ven},Q_{AV})=
\begin{cases}
(Q_{PVein\_LA},Q_{MV}) & \mathrm{LA},\\
(Q_{VC\_RA},Q_{TV}) & \mathrm{RA}
\end{cases}
$$

とする。waveform sampleを区分線形補間し、台形則で

$$
I_{ven}=\int_{t_{open}}^TQ_{ven}\,dt,
\qquad
I_{AV}=\int_{t_{open}}^TQ_{AV}\,dt,
$$

$$
\Delta V_A=V_A(T)-V_A(t_{open}),
\qquad
\epsilon_{trap}=\Delta V_A-(I_{ven}-I_{AV})
$$

を報告する。保存fieldは、区間、flow ID、`trapezoidalVenousInflowVolumeM3`、`trapezoidalAvOutflowVolumeM3`、`netIntegratedInflowMinusOutflowM3`、`observedAtrialVolumeChangeM3`、`trapezoidalDiscreteMassBalanceClosureErrorM3`、`absoluteTrapezoidalDiscreteMassBalanceClosureErrorM3`、`rightCensoredAtCycleEnd=true`、`formalPeriodOne=false`である。$\epsilon_{trap}$はendpoint Backward Euler残差そのものではなく、保存されたcoarse waveformを台形積分したpost-processing誤差を含む診断値である。したがって、PV形状fitやacceptance gateには使わない。validatorはwaveformからこの診断を再構築し、report直下とterminal cycleの`cycleSummaries[].trend.atrialPostOpeningMassBalanceDiagnostic`とのcanonical equalityを要求する。

exploratory artifactは各拍について、LA/RAのright-censored conduit・later-refill診断、上記mass-balance診断、4心腔のnonperiodic closed-polygon診断、選択した容積・圧・流量の最小値・最大値・時間平均を`cycleSummaries[].trend`へ保存する。closed-polygon診断は、観測open pathの$\int P\,dV$、人工closing chordの寄与、閉多角形積分、符号付き・絶対shoelace面積を分離し、`formalPeriodOne=false`および`physiologicalLoopWorkClaimed=false`を固定する。したがって、周期seamを隠した形状評価や、人工chordを心房仕事と読むことはできない。

LVEDPは最大LV容積時の圧として定義しない。心房収縮後、最初の心室Ca drive（正常scheduleではSEP）を適用する直前のevent transaction left-limitから

$$
(V_{LV},P_{LV})\big|_{t=t_{V,Ca}^{-}}
$$

を直接読む。normal prospective bandは5–15 mmHgとし、period-1が成立した拍だけを合否対象にする。これにより、心室activation後に容積がわずかに増え続ける点をEDPVR点と誤認しない。

## 16. 現在の主張境界と未検証事項

### 16.1 実装済みといえるもの

- main-wire owner由来の非冠15区画、11血管edge、4弁edgeからなる閉鎖循環topologyと保存式。
- main-wireの非線形動脈、線形毛細管、3領域静脈PV則のSI/energy-conjugate adapter。
- 6動的flow、9符号付き代数flow、waterfallを同じendpointで評価するkernel。
- 4弁の保存開口state、$C^2$圧較差gate、解析的Backward Euler局所消去、面積依存$R/B$、符号付き逆流、および非負flow散逸。開口stateを含めてもglobal Newton未知数は58/53のままである。
- 4心腔固定境界、11 edge圧損、5.6 L TBVを同時に閉じる分布血管初期化。
- 15 volume + Land/SLS/TriSegを同時に解く58/53未知数のresearch-only monolithic Backward Euler経路。
- LA/RA CMR phasic anatomy construction。
- Moyer 2015受動則の等二軸one-fiber縮約。
- LA/RA別の単調inverse unloading。
- 独立1-state SLS、passivity audit、および心房SLSをMoyer $e\to0^+$ tensile-side tangentへscale結合する明示的provenance。
- Land active-only、Lewalle LA saturation force scaleへ写像したshared atrial $T_{ref}$、whole-organ ventricular $T_{ref}$選択。
- LA/RAのpopulation-only Land reductionと、旧source-distortionだけを戻すcausal-control binding。
- Mazhar 2024 Table 2のtiming範囲だけを使うMazhar-timing-bounded atrial Ca V2 candidateと、baseline・振幅が同Table範囲外で未同定であることを固定するaudit。
- 心房/心室class別の低次数Ca timing reconstructionとisolated twitch component audit。
- CMR mass/volumeからのTriSeg wall construction。
- finite-thickness energy-conjugate TriSegとKoiter bending。
- Klotz ED anchorによる共通tensile energy scale root。
- 7未知数pre-A construction root。
- main-wireの指定拍数exploratory cycle-map runner、endpoint-distance/TBV readback、event alignment、失敗区間だけの二分retry。
- reportとwaveformへ実際の`SLS on/off` modeを明記し、node/edge順序、時刻、全sample、設定、claim boundary、相互content hashをstrictに検証するartifact bundle。
- waveformから心房readback、conduit/later-refill、post-opening right-censored mass balance、4心腔closed-polygon診断、waveform summaryを再構築し、埋め込みpayloadとのcanonical equalityを検証するreadback経路。
- 実行開始時に、Git `HEAD` commit（`repositoryHeadCommit`）、`HEAD^{tree}`（`repositoryHeadTree`）、出力artifactを除くtracked worktree/index patch SHA-256（`trackedWorktreePatchSha256`、`trackedIndexPatchSha256`）、`trackedWorktreeClean`、`package-lock.json` file-byte SHA-256（`packageLockContentSha256`）、`nodeVersion`を`gitSourceReproducibilityAtRunStart`へ保存する。`untrackedPathsExcludedFromCleanlinessCheck=true`も明示する。
- 実行開始時とartifact書込み直前に、`topology.ts`、`params.ts`、graph resolver、vascular topology/PV adapter、same-time circulation kernel、dynamic aperture、vascular initializer、distributed endpoint/solver、runnerからなる直接numerical owner 11ファイルをfile-byte SHA-256で`directNumericalOwnerSourceSnapshotAtStart`へsnapshotし、run中にtracked Git/source状態またはowner byteが変わればfail-closedにする。加えてsource manifest、source numerical evidence、event schedule、wall material bindingのcontent SHA-256と、file/canonical-object hash algorithm IDをreport provenanceへ保存する。
- report/waveformをrun固有temporary pathへ排他的に書き、readback、content hash、report–waveform binding、再構築diagnosticのcanonical equalityを検証してからcanonical pathへrenameし、canonical pairを再読込して検証するartifact integrity gate。
- 上記SHA-256群は、どのlocal source/tree/runtimeで生成したかを再現・改変検出する**integrity/reproducibility metadata**である。署名commit、署名artifact、provenance attestation、実行主体のidentity、source repositoryの信頼性を認証するauthentication機構ではない。
- mechanics componentおよび旧aggregate経路のcompact mechanical-energy diagnostic（新main-wire whole-cycle ledgerではない）。
- 全5壁の解析chain-ruleひずみ速度と、中心差分をaudit-onlyにした仕事共役gate。
- 最初の心室Ca drive直前committed left-limitからのevent-local LVEDP readback。
- 旧aggregate whole-heart energy accountingへKoiter energyを含める経路。

### 16.2 まだ主張できないもの

- 正常成人のperiod-1最終波形が全targetを満たすこと。
- LV/RV、LA/RAのPV loopが生理的にvalidation済みであること。
- 弁圧較差、E/A、PV flow、VC flowが正常範囲に入ること。
- SLS parameterがヒト組織データで同定済みであること。
- Moyer LA materialがRAまたは全populationに普遍であること。
- Klotz replayがRV受動則をvalidationすること。
- $E_b=3$ kPaが一意に同定された曲げmodulusであること。
- Lewalle force scale以外の心房Land kineticsがヒトLA/RAで同定済みであること。
- RA active force scaleがRA組織で直接測定済みであること。
- 2指数prescribed calciumが測定Ca波形または保存Ca cyclingであること。
- Mazhar-timing-bounded atrial Ca V2の絶対baseline、振幅、または電気–Ca delayがMazhar 2024から同定済みであること。
- population-only Land reductionがヒト心房の微視的force–velocity則として同定済みであること。
- 4弁dynamic apertureはmain-wire distributed kernelへ統合済みだが、Mynard式そのものの再現または弁parameter validation済みとは主張できない。現式はmain-wire parameterを使うMynard-inspired低次圧較差駆動modelである。
- population-only + Moyer-consistent SLS + Mazhar-timing-bounded Ca V2 + dynamic valveが、formal period-1、time-step convergence、同拍数2×2 ablation後にも$P_{post\text{-}y}>P_{pre\text{-}y}$と収縮末期secondary hook消失を維持すること。現3拍結果はSection 18.5のdevelopment diagnosticに留める。
- 現runは指定回数の単純なcycle-map反復であり、period-1判定を実装していない。したがってterminal拍は非周期であり得て、right-censored atrial readbackや人工closing chordを周期loopまたは生理的仕事として解釈できない。
- retryなしのno-subdivision runを含むtime-step convergence、multi-start periodic uniqueness、長期安定性。現solverはscaled five-point numerical algorithmic Jacobianを用い、analytic/automatic differentiation Jacobian、generalized Jacobian audit、semismooth active-set convergenceをまだ持たない。
- main-wire分布循環candidateの正式なperiod-1判定、15 edge平均流gate、whole-cycle committed energy ledger、正常生理target通過。
- `buildNodes/buildEdges/defaultParams`はbaseline ownerとして共有するが、`venousTone`、`arterialStiffness`、抵抗倍率、`nodeOverrides/edgeOverrides`のeffective値変換は現resolverが`ModelCore`規則を手動mirrorしている。両経路のdriftを構造的に排除するcanonical effective-parameter resolverは未実装である。
- 現distributed solverは旧8区画`PhaseB1EventFreeMonolithicModelV1`へ分布血管volumeをaggregateして渡し、心房・心室壁、TriSeg、心膜だけを評価するmechanics-only proxyを使う。旧aggregate血管圧・流・volume residualは消費しないが、将来は血管dummy stateを要求しない狭い`HeartMechanicsOnly` APIへ分離する必要がある。
- 静脈PV inverseのreviewed pressure supportは現V1で$[-20,45]$ mmHgに固定され、node別strict volume boundと最小domain marginへ変換される。これは病態domainではなく、parameterごとの最大単調区間を自動構築するadaptive supportは未実装である。
- mechanicsと血管を同じ非zero intrathoracic pressureへ同期した呼吸・胸腔圧variant（現runnerのnormal candidateは$P_{th}=0$限定）。
- `PVein_LA`正inertanceを含む7-dynamic-flow variant。
- 冠循環のLand–TriSeg energy ledgerへの接続。
- patient-specific fitのidentifiability。
- AVPD/MAPSE/TAPSE/s'/a' observerの実装。
- `ModelCore`、browser product、release runtimeへの採用。
- reportとwaveformは個別のfilesystem renameで公開するため、2ファイルを単一transactionとしてatomicに交換する機構ではない。通常failureではcanonical pairを削除し、validatorは片側欠損・hash不一致を拒否するが、process/hostが2回のrename間で強制終了した場合のpartial pairまでfilesystem levelで防ぐものではない。

したがって、現時点の正確なラベルは**literature-informed mechanistic candidate**であり、validated normal-human digital twinではない。

## 17. 実装対応表

| 責任 | 実装 |
|---|---|
| 心房CMR解剖・wall mass | [`atrialAnatomyPassiveTargetsV2.ts`](../../../engine/myocardium/fourChamberV1/anatomy/atrialAnatomyPassiveTargetsV2.ts) |
| 心室CMR/Klotz anchor | [`ventricularAnatomyEdpvrTargetsV1.ts`](../../../engine/myocardium/fourChamberV1/anatomy/ventricularAnatomyEdpvrTargetsV1.ts) |
| Moyer exact reduction | [`moyer2015AtrialEquibiaxialPassiveV3.ts`](../../../engine/myocardium/fourChamberV1/passive/moyer2015AtrialEquibiaxialPassiveV3.ts) |
| 心房inverse unloading | [`normalAdultAtrialMechanicsCandidateV3.ts`](../../../engine/myocardium/fourChamberV1/calibration/normalAdultAtrialMechanicsCandidateV3.ts) |
| active tissue-class prior | [`normalAdultActiveTissueClassPriorV1.ts`](../../../engine/myocardium/fourChamberV1/land/normalAdultActiveTissueClassPriorV1.ts) |
| human-atrial Ca timing V2 | [`normalAdultHumanAtrialCalciumTimingCandidateV2.ts`](../../../engine/myocardium/fourChamberV1/calcium/normalAdultHumanAtrialCalciumTimingCandidateV2.ts) |
| Land source/rate-free厳密同値 | [`rateFreeDistortionEquivalenceV1.ts`](../../../engine/myocardium/fourChamberV1/land/rateFreeDistortionEquivalenceV1.ts) |
| 心房population-only Land | [`atrialPopulationOnlyLandV1.ts`](../../../engine/myocardium/fourChamberV1/land/atrialPopulationOnlyLandV1.ts) |
| 心室構造・Klotz scale | [`ventricularStructuralCalibrationV2.ts`](../../../engine/myocardium/fourChamberV1/calibration/ventricularStructuralCalibrationV2.ts) |
| 正常心室candidate | [`normalAdultVentricularMechanicsCandidateV2.ts`](../../../engine/myocardium/fourChamberV1/calibration/normalAdultVentricularMechanicsCandidateV2.ts) |
| finite-thickness TriSeg | [`energyConjugateFiniteThicknessTriSegV2.ts`](../../../engine/myocardium/fourChamberV1/triseg/energyConjugateFiniteThicknessTriSegV2.ts) |
| TriSeg equilibrium root | [`energyConjugateFiniteThicknessTriSegRootV2.ts`](../../../engine/myocardium/fourChamberV1/triseg/energyConjugateFiniteThicknessTriSegRootV2.ts) |
| SLS | [`oneStateAlphaVSlsV1.ts`](../../../engine/myocardium/fourChamberV1/passive/oneStateAlphaVSlsV1.ts) |
| Land material binding | [`phaseB1WallMaterialBindingV1.ts`](../../../engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1.ts) |
| main-wire graph shared resolver | [`mainWireHemodynamicGraphV1.ts`](../../../engine/core/mainWireHemodynamicGraphV1.ts) |
| main-wire非冠topology SI contract | [`mainWireNonCoronaryVascularTopologyV1.ts`](../../../engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularTopologyV1.ts) |
| main-wire血管PV/energy adapter | [`mainWireVascularPvLawSiV1.ts`](../../../engine/myocardium/fourChamberV1/vascular/mainWireVascularPvLawSiV1.ts) |
| main-wire同一時刻循環kernel | [`mainWireNonCoronarySameTimeLevelV1.ts`](../../../engine/myocardium/fourChamberV1/hydromechanics/mainWireNonCoronarySameTimeLevelV1.ts) |
| main-wire dynamic aperture | [`mainWireDynamicValveApertureV1.ts`](../../../engine/myocardium/fourChamberV1/hydromechanics/mainWireDynamicValveApertureV1.ts) |
| main-wire血管TBV初期化 | [`mainWireNonCoronaryVascularInitializerV1.ts`](../../../engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularInitializerV1.ts) |
| 15区画endpoint topology | [`phaseB1MainWireDistributedEndpointV1.ts`](../../../engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedEndpointV1.ts) |
| 15区画monolithic BE | [`phaseB1MainWireDistributedMonolithicBackwardEulerV1.ts`](../../../engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedMonolithicBackwardEulerV1.ts) |
| 旧8区画比較kernel（新solverでは非owner） | [`closedLoopSameTimeLevelV1.ts`](../../../engine/myocardium/fourChamberV1/hydromechanics/closedLoopSameTimeLevelV1.ts) |
| pre-A hemodynamic prior | [`preAOperatingPointHemodynamicConstructionPriorV2.ts`](../../../engine/myocardium/fourChamberV1/physiology/preAOperatingPointHemodynamicConstructionPriorV2.ts) |
| pre-A 7D root | [`phaseB1PreAOperatingPointInitializerV2.ts`](../../../engine/myocardium/fourChamberV1/phaseB1/phaseB1PreAOperatingPointInitializerV2.ts) |
| full candidate case | [`phaseB1MechanisticRebuildCaseV2.ts`](../../../engine/myocardium/fourChamberV1/phaseB1/phaseB1MechanisticRebuildCaseV2.ts) |
| periodic continuation | [`phaseB1MechanisticPeriodicContinuationV1.ts`](../../../tools/myocardium/phaseB1MechanisticPeriodicContinuationV1.ts) |
| 心房PV読出し（現candidateではdevelopment diagnostic） | [`phaseB1AtrialPvReservoirConduitReadbackV1.ts`](../../../tools/myocardium/phaseB1AtrialPvReservoirConduitReadbackV1.ts) |
| 旧8区画比較runner | [`runPhaseB1MechanisticRebuildV2.ts`](../../../tools/myocardium/runPhaseB1MechanisticRebuildV2.ts) |
| main-wire exploratory repeated-cycle runner | [`runPhaseB1MainWireDistributedV1.ts`](../../../tools/myocardium/runPhaseB1MainWireDistributedV1.ts) |
| main-wire 4心腔PV・圧・弁流量HTML | [`renderPhaseB1MainWireDistributedHtmlV1.ts`](../../../tools/myocardium/renderPhaseB1MainWireDistributedHtmlV1.ts) |

## 18. main-wire 3拍 exploratory artifactの読出し

### 18.1 旧candidateのexploratory全体系readback

clean tracked source commit `2361461efab778d460e83e53c133657cb025f031`から、SLS-on、nominal $\Delta t=4$ ms、最大3段retry、60 Newton iteration、3拍で非冠15区画main-wire exploratory runを行った。reportは[`phase-b1-main-wire-distributed-exploratory-v1.json`](../../../data/myocardium/reports/phase-b1-main-wire-distributed-exploratory-v1.json)、waveformは[`phase-b1-main-wire-distributed-exploratory-v1.waveform.json`](../../../data/myocardium/visuals/phase-b1-main-wire-distributed-exploratory-v1.waveform.json)である。content SHA-256はそれぞれ`2afc64c59a2a22e447294893e564af881558d279593d302604543aaa441317a1`、`2b48bd8d9c4e88614c66c1960acd810dc3f2bc01dc95a12f9ad18626c5fcd719`である。

拍ごとのcomplete-state endpoint distanceは$15.5222\rightarrow0.6789\rightarrow0.4002$へ低下した。ただしformal period-1判定は実装しておらず、terminal拍も非周期として扱う。全3拍でNewton failureによるretry subdivisionは0、model/constitutive fallbackは0、terminal拍のTBV最大相対driftは$4.65\times10^{-16}$、run全体の最小血管PV-domain marginは21.886 mLだった。

terminal拍のLAでは、functional MV openingは0.52010 s、50.958 mLであり、開放後に0.803 mLの短いovershootを経て0.536 sに51.761 mLとなった。その後35.575 mLまで16.186 mL emptyingしたが、0.648 sの最小値から観測拍末まで9.761 mL再充満した。これはearly emptyingの60.3%であり、RAの1.808 mL、9.5%より明らかに大きい。

このLA右向き区間はvolume bookkeeping errorではない。開放から拍末までの右censored質量収支は、$\int Q_{PVein\_LA}dt=50.946$ mL、$\int Q_{MV}dt=56.524$ mL、その差$-5.578$ mLに対して観測$\Delta V_{LA}=-5.622$ mL、coarse waveform台形積分のclosure errorは$-0.0436$ mLである。最小容積後は$Q_{MV}$ E-waveが$Q_{PVein\_LA}$より早く減衰し、平均で$Q_{PVein\_LA}=172.36$ mL/s、$Q_{MV}=109.39$ mL/sとなった。同区間でPVein、PVen、PCap storageはそれぞれ9.88、8.86、7.10 mL減少し、最小値付近の$P_{PVein}-P_{LA}=7.64$ mmHgは拍末でも3.26 mmHg残った。したがって直接的な方向反転は

$$
Q_{PVein\_LA}-Q_{MV}:\quad -\ \longrightarrow\ +
$$

であり、その大きさと持続を肺静脈系storageの放出が支えている。LA passive/Land/SLSを直接調整してこの形を消す根拠にはならない。一方、terminal拍でもLA later-refillが大いことは確かであり、period-1継続後も残る場合は、肺循環storage時定数、LV弛緩・受動圧上昇、MVの有効開口と慣性を同時に分解する。

terminal拍の左心系は、Ao 74.8–104.0 mmHg、CO 5.82 L/min、LV EDV/ESV 156.9/76.8 mL、EF 51.0%であった。したがって全身血圧はなお低め、LVはなお大きく収縮性もnormal-adult targetを満たしたとは言えない。この旧static-area artifactから決めた次段階がmain-wire dynamic valveであり、現candidateでは実装済みである。新しい優先順位はformal periodic continuation、time-step convergence、whole-cycle energy、同拍数causal ablationとnormal envelopeであり、詳細parameter fittingではない。

### 18.2 LA同容積branch inversionと収縮末期hookの因果分解

正常成人candidateで期待するconduit branchの方向条件を、形状類似度ではなく同一容積で

$$
\boxed{
P_{LA,post\text{-}y}(V)>P_{LA,pre\text{-}y}(V)
}
$$

と定義する。`pre-y`はMV開放後、y谷へ向かうearly-conduit、`post-y`はy谷後から心房収縮前までのlate-conduit/recoveryである。正常中心candidateでは、同じ容積へ戻ったpost-y側の圧がpre-y側より高いことをprospective directional diagnosticとする。ただし、これは直接測定で確立された普遍的正常則ではない。また、LV suctionがLA固有elastanceを直接変えるという意味でもない。現AVPDなしone-fiber modelでは、LVはMV流量とLAの材料履歴を介して軌道を変える。従ってformal period-1後の正常candidateに対する仮説としてのみ扱う。

旧3拍artifactでは

$$
\Delta P_y(V)
=P_{post\text{-}y}(V)-P_{pre\text{-}y}(V)
$$

が40 mLで$-1.101$ mmHg、45 mLで$-2.431$ mmHgであり、期待方向と逆だった。心房圧を

$$
P_{LA}=\Gamma(V_{LA})
\left(\tau_{\infty}+\tau_{active}+q_v\right)+P_{ext},
\qquad
\Gamma(V)=\frac{V_{w,LA}}{3(V+V_{w,LA}/2)}
$$

に分解すると、同じ40 mLで平衡Moyer項と幾何係数は一致し、旧$E_v\approx175$ Pa SLSのbranch差寄与は約$+0.009$ mmHgにすぎなかった。このrunではcommon pericardium項は0で、胸腔圧も0であり、外圧差も原因ではない。従って$-1.101$ mmHgの反転をSLSだけでは説明できず、その旧軌道のcomponent arithmeticではLand active-history残留が支配的だった。ただし、これはLand内部のどのkinetic termが一意原因かを同定しない。

収縮末期hookでも、旧artifactの該当区間で容積が減る間に平衡受動圧は$-2.296$ mmHg低下したのに対し、Land active寄与は$+3.012$ mmHg上昇し、正味約$+0.716$ mmHgの左上向きhookを作った。これは単なる血液量収支または肺静脈storageでは説明できず、**その旧軌道ではLand active成分が支配的だった**ことを示す。一方、旧`rate-free` $\xi$がsource Landのforce–velocity distortionを保持し、one-fiberのglobal atrial volume rateがdriveへ入ることは、原因候補としてimplicatedされるに留まる。Land–Niedererの再伸展時張力応答は方向的根拠を与えるが、同論文も$A_{eff}$を一意原因とはしていない。Ca relaxation、length dependence、弁流量との相互作用を含むため、この閉ループ分解だけで微視的crossbridge kineticsまたはglobal-volume-rate closureを一意同定しない。

### 18.3 採択する最小構造変更

以上から、中心candidateは次の4変更を**責任分離したまま**組み合わせる。

1. LA/RA Landは$CaTRPN,B,W,S$のstate構造、非distortion基礎遷移係数、calcium依存性、長さ依存性を保持し、$A_{eff}=A_W=A_S=0$とするorgan-scale population-only reductionを使う。canonical zero-distortion manifoldでは$\zeta_W=\zeta_S=0$となるため、$\zeta$依存detachment $\gamma_{wu}W,\gamma_{su}S$、$W\zeta_W$、$S\zeta_S$のstress寄与も除かれる。従ってこれは加算的な旧$F_v$だけを消す操作ではなく、未解像global atrial volume-rate由来のforce--velocityおよびstrain-dependent detachment closure全体を除く縮約である。source Landの短縮時population kineticsを保存したという主張ではなく、旧source-distortionはcausal controlだけに残す。
2. 独立SLSはMoyer $e\to0^+$ tensile-side tangentへscaleを結び、LA/RA共通$E_v=9950.14$ Pa、$\tau_v=50$ msとする。これはparameter provenance/scale整合化priorであり、物理必須条件、PV loop fit、またはヒト心房粘弾性同定ではない。
3. 心房CaはMazhar 2024の37 ℃human atrial timing aggregateに基づく二重指数V2を使う。ただしbaselineと振幅は同文献範囲外のLand-context priorであり、未同定と明示する。
4. 4弁はmain-wire ownerのMynard-inspired dynamic aperture stateを用い、開閉遅延、面積依存loss、慣性を分離する。Mynard式そのものの再現とは呼ばず、弁stateで心房active stressを補正しない。

この順序は「PV loopをそれらしく描くため」の連続自由度追加ではない。各constructorはPV metricを入力として消費せず、旧軌道でimplicatedされたactive kinematic closure、stress scaleの由来が不整合だった受動memory、測定timingから外れていたCa duration、開口履歴を欠いた弁境界を、それぞれ独立のownerで扱う。ただしarchitecture選択自体は旧圧反転とhookのclosed-loop診断にinformされているため、同じ診断を独立held-out validationと呼ばない。

time-varying elastance、phase-gated force、圧波形filter、PV座標依存の補正項は、自律系・仕事共役性・病態parameterの識別性を損なうため採用しない。追加の非自己相似shape coordinate $q_A$は将来の有力な競合topologyになり得るが、局所壁strain、弁輪形状、regional volumeの独立データなしではPV形状を吸収する未同定自由度になる。従って現段階では追加せず、population-only構成が画像由来local strainを説明できないときに限り再検討する。

### 18.4 causal ablationとnormal-envelope acceptance

中心candidateを単一の波形で採択しない。少なくとも次のarmを同一解剖、循環、初期TBV、time gridで比較する。

- population-only Land + Moyer-consistent SLS + Ca timing V2 + dynamic valve（中心candidate）。
- source-distortion control（$A_{eff}$だけを旧値へ戻す）。
- SLS-off control。
- atrial Ca timing V1 control。
- 旧pressure-gated static-area valve control。

各armはcomplete-state periodic continuationの後に評価し、少なくとも1/0.5/0.25 msで方向・量の収束を確認する。3拍目またはterminal configured cycleだけをperiod-1と呼ばない。非periodic exploratory拍では下記をcausal diagnosticとして報告してよいが、生理的loop workや正式合否には使わない。

正常中心点およびpredeclared envelopeでは、次を同時に読む。

- matched-volume $\Delta P_y(40\ \mathrm{mL})$と$\Delta P_y(45\ \mathrm{mL})$。正常中心candidateの方向条件は両者$>0$であり、補間support外なら欠測として扱って外挿しない。
- dominant primary A-pressure peak後に一度圧下降が始まり、active emptyingが終わる最小容積まで$\dot V_{LA}<0$のまま再上昇する**secondary hook**の最大振幅、持続時間、active/passive/SLS成分。正常なprimary A-wave上昇をhookへ数えず、MV closure前後とventricular activation後のc-wave候補を別表示する。現動的弁にはleaflet displacementがないため、モデル内の二次上昇を生理的c-waveとして自動的に正当化しない。time-step halvingで残る正のsecondary hookを数値noiseとして無視しない。
- y谷前後の$Q_{PVein\_LA}-Q_{MV}$、early emptying、later-refill ratio、right-censored質量収支。branch orderingを弁または肺静脈flowの誤りから切り離す。
- LA/RAのA-loop/V-loop orientationと面積、4弁の開閉時相・正味順行量・逆流量・圧較差、PV/VC flow、E/A。ただしloop面積はformal period-1後だけを生理的仕事候補とする。
- SA/PA/LA/RA圧、左右CO、LV/RV EDV/ESV/EF、event-local LVEDP。心房形状を改善しても低血圧、過大LV、低収縮性を隠さない。
- TBV closure、Land population domain、SLS物理・離散散逸、弁flow散逸、TriSeg平衡、projection/clamp/model fallback不使用、complete-state endpoint/streak convergence。

robustness envelopeは、正常中心点だけでなく、HR、preload/TBV、体・肺血管抵抗、心室収縮力、心房activation/force、受動硬さのpredeclaredな軽度変動を含める。全点を同じPV形状へ強制するのではなく、解が有限・保存的で、因果方向が説明可能であり、病態軸が別ownerとして識別可能であることを要求する。envelope結果を見る前にparameterを固定し、各点ごとの再fitはしない。

### 18.5 population-only + SLS-on + dynamic-valve 3拍development readback

clean tracked source commit `33b035787afcc98aa40da438520b7c8cbceb8876`から、SLS-on、population-only Land、Mazhar-timing-bounded Ca V2、main-wire dynamic valve、nominal $\Delta t=4$ ms、3拍で再計算した。reportは[`phase-b1-la-history-dynamic-valve-v1.json`](../../../data/myocardium/reports/phase-b1-la-history-dynamic-valve-v1.json)、waveformは[`phase-b1-la-history-dynamic-valve-v1.waveform.json`](../../../data/myocardium/visuals/phase-b1-la-history-dynamic-valve-v1.waveform.json)である。content SHA-256はそれぞれ`3b1f971ab25c975a56a6c0bbb973a1916b90a1ce2cb622449da54b63029bb1b5`、`795ae53b91cac988e8abd5e9847818a73eb6ed1a709844a6ba9a3de5bf5bf8dc`である。

complete-state endpoint distanceは$7.4422\rightarrow0.8829\rightarrow0.5519$へ低下したが、formal period-1判定は行っておらず、収束済みとは呼ばない。全3拍でretry subdivisionは0、model/constitutive fallbackは0、terminal拍TBV最大相対driftは$4.65\times10^{-16}$、run全体の最小vascular PV-domain marginは21.778 mLだった。population-only LA/RAのaccepted endpointは毎stepでzero-distortion manifoldのroundoff幅内に留まった。

terminal拍LAでは、functional MV openingが0.540004 s、57.465 mLで、その後0.580 sまでに61.124 mLへ3.659 mL右向きに進んだ。従ってopeningからy谷までを厳密単調conduitとする公式readbackは`ambiguous`であり、理由は`conduit-branch-is-not-strictly-decreasing`である。この区間はdynamic apertureの開口遅延中に$Q_{PVein\_LA}>Q_{MV}$となるflow-balance問題として残り、波形を見て$\tau_{open}$またはPV抵抗を調整して消していない。

初期右向き区間後のdecreasing branchは0.708 s、34.146 mL、3.931 mmHgでy谷へ達し、拍末には43.234 mL、6.404 mmHgまで再充満した。post-opening最大容積からy谷までを`pre-y`、y谷から非周期拍末までをright-censored `post-y`としてpiecewise-linear補間したdevelopment readbackでは

$$
\Delta P_y(36,38,40,42\ \mathrm{mL})
=(0.381,\ 0.514,\ 0.570,\ 0.567)\ \mathrm{mmHg}
$$

となり、観測support内では期待方向へ反転した。44、45 mLは両branchの共通support外なので外挿しない。これはSection 18.2のprospective仮説に沿うが、right-censored非周期軌道かつarchitecture-informed diagnosticであり、独立validationではない。

primary A-pressure peakは0.088 s、17.785 mmHgで、その後active emptyingが終わる最小LA容積17.821 mLまで圧は単調に低下し、定義したsecondary hook振幅は0 mmHgだった。ただしsource-distortion、SLS、Ca、dynamic valveを同拍数・同一periodic orbitで直交比較していないため、population-only reductionを一意原因とはしない。

SLS-off 1拍controlは[`phase-b1-la-history-sls-off-control-v1.json`](../../../data/myocardium/reports/phase-b1-la-history-sls-off-control-v1.json)と[`phase-b1-la-history-sls-off-control-v1.waveform.json`](../../../data/myocardium/visuals/phase-b1-la-history-sls-off-control-v1.waveform.json)へ保存した。content SHA-256はそれぞれ`2b3b71f3a6bca2d5d04e3e8079c5ac7a80ee8523ce932895dabb86a9fd0e78ed`、`0cdbab377e512b3cec3e833e13f29b0a3649bdd79662f39fff1b19b4c9f57c73`である。同じ補間で36–44 mLの$\Delta P_y$は$-0.102$から$-0.198$ mmHgだった。SLS historyがbranch memoryへ関与する強い手掛かりだが、SLS-onは3拍、offは1拍で周期状態が異なるため、差をSLSの定量的因果寄与として差し引かない。

terminal拍の全体系readbackは、LA 3.93–17.78 mmHg、RA 0.47–8.76 mmHg、Ao 76.59–107.97 mmHg、SA 75.56–86.74 mmHg、PA 7.48–36.85 mmHgである。LV EDV/ESVは160.02/75.95 mL、EF 52.54%、RVは175.11/96.92 mL、EF 44.65%、AoV/PuV平均flowは6.22/5.86 L/minだった。圧は旧candidateより改善したが、LV/RVはなお大きく収縮性もmodestであり、正常成人validationとは呼ばない。

次の最小検証は、population-only/source-distortion $\times$ SLS-on/offの2×2を同じformal period-1、1/0.5/0.25 ms、同じpredeclared normal envelopeで比較することである。そこで$\Delta P_y$成分、secondary hook、$Q_{PVein\_LA}-Q_{MV}$、SLS $(q_v,\alpha_v)$、弁$(\xi,A_{eff})$を同時保存する。Ca V1/V2とstatic/dynamic valveは、その後にone-factor controlとして分ける。

## 19. 一次文献

1. Moyer CB, Norton PT, Ferguson JD, Holmes JW. Changes in Global and Regional Mechanics Due to Atrial Fibrillation: Insights from a Coupled Finite-Element and Circulation Model. [doi:10.1007/s10439-015-1256-0](https://doi.org/10.1007/s10439-015-1256-0), [PMC4497915](https://pmc.ncbi.nlm.nih.gov/articles/PMC4497915/).
2. Li W et al. Reference value of left and right atrial size and phasic function by SSFP CMR at 3.0 T in healthy Chinese adults. [doi:10.1038/s41598-017-03377-6](https://doi.org/10.1038/s41598-017-03377-6).
3. Flink IL et al. Left atrial mass: relationship between gross anatomy and quantitative echocardiography. [doi:10.1016/j.carpath.2020.107265](https://doi.org/10.1016/j.carpath.2020.107265).
4. Gaurilcikas A et al. Human heart atria and appendages: morphometry and clinical importance. [institutional record](https://hdl.handle.net/20.500.12512/83288).
5. Wright SP et al. Left atrial reservoir pressure-volume relations during exercise in healthy older adults. [doi:10.1152/japplphysiol.00905.2023](https://doi.org/10.1152/japplphysiol.00905.2023).
6. Dernellis JM et al. Left Atrial Mechanical Adaptation to Long-Standing Hemodynamic Loads Based on Pressure-Volume Relations. [doi:10.1016/S0002-9149(98)00134-9](https://doi.org/10.1016/S0002-9149(98)00134-9).
7. Wessels JN et al. Right Atrial Adaptation to Precapillary Pulmonary Hypertension: Pressure-Volume, Cardiomyocyte, and Histological Analysis. [doi:10.1016/j.jacc.2023.05.063](https://doi.org/10.1016/j.jacc.2023.05.063).
8. Zhan Y et al. Derivation of consolidated normal reference values for right and left ventricular quantification by CMR. [doi:10.1186/1532-429X-18-S1-O75](https://doi.org/10.1186/1532-429X-18-S1-O75).
9. Lumens J, Delhaas T, Kirn B, Arts T. Three-Wall Segment (TriSeg) Model Describing Mechanics and Hemodynamics of Ventricular Interaction. [doi:10.1007/s10439-009-9774-2](https://doi.org/10.1007/s10439-009-9774-2), [PMC2758607](https://pmc.ncbi.nlm.nih.gov/articles/PMC2758607/).
10. Klotz S et al. Single-beat estimation of end-diastolic pressure-volume relationship. [doi:10.1152/ajpheart.01240.2005](https://doi.org/10.1152/ajpheart.01240.2005).
11. Vinnakota KC, Bassingthwaighte JB. Myocardial density and composition. [doi:10.1152/ajpheart.00478.2003](https://doi.org/10.1152/ajpheart.00478.2003).
12. Palit A et al. In vivo estimation of passive biomechanical properties of human myocardium. [doi:10.1007/s11517-017-1768-x](https://doi.org/10.1007/s11517-017-1768-x).
13. Land S et al. A model of cardiac contraction based on novel measurements of tension development in human cardiomyocytes. [doi:10.1016/j.yjmcc.2017.03.008](https://doi.org/10.1016/j.yjmcc.2017.03.008).
14. Land S, Niederer SA. Influence of atrial contraction dynamics on cardiac function. [doi:10.1002/cnm.2931](https://doi.org/10.1002/cnm.2931).
15. Heldt T et al. Computational model of cardiovascular response to orthostatic stress. [doi:10.1152/japplphysiol.00241.2001](https://doi.org/10.1152/japplphysiol.00241.2001).
16. Magder S, De Varennes B. Clinical death and the measurement of stressed vascular volume. [doi:10.1097/00003246-199806000-00028](https://doi.org/10.1097/00003246-199806000-00028).
17. Lewalle A et al. Human atrial skinned muscle fibers exhibit reduced length-dependent activation but show faster force development kinetics than ventricular muscle. [doi:10.1016/j.yjmcc.2025.12.001](https://doi.org/10.1016/j.yjmcc.2025.12.001), [PubMed 41349712](https://pubmed.ncbi.nlm.nih.gov/41349712/).
18. Bowman AW, Kovács SJ. Left atrial conduit volume is generated by deviation from the constant-volume state of the left heart: a combined MRI-echocardiographic study. [doi:10.1152/ajpheart.00969.2003](https://doi.org/10.1152/ajpheart.00969.2003), [PubMed 14751859](https://pubmed.ncbi.nlm.nih.gov/14751859/).
19. Gerringer JW et al. Lumped-parameter models of the pulmonary vasculature during the progression of pulmonary arterial hypertension. [doi:10.14814/phy2.13586](https://doi.org/10.14814/phy2.13586), [PMC5901176](https://pmc.ncbi.nlm.nih.gov/articles/PMC5901176/).
20. Stergiopulos N, Segers P, Westerhof N. Use of pulse pressure method for estimating total arterial compliance in vivo. [doi:10.1152/ajpheart.1999.276.2.H424](https://doi.org/10.1152/ajpheart.1999.276.2.H424), [PubMed 9950841](https://pubmed.ncbi.nlm.nih.gov/9950841/).
21. Mynard JP et al. A simple, versatile valve model for use in lumped parameter and one-dimensional cardiovascular models. [doi:10.1002/cnm.1466](https://doi.org/10.1002/cnm.1466).
22. Bowman AW, Frihauf PA, Kovács SJ. Time-varying effective mitral valve area: prediction and validation using cardiac MRI and Doppler echocardiography in normal subjects. [doi:10.1152/ajpheart.00269.2004](https://doi.org/10.1152/ajpheart.00269.2004), [PubMed 15155259](https://pubmed.ncbi.nlm.nih.gov/15155259/).
23. Mazhar F et al. A detailed mathematical model of the human atrial cardiomyocyte: integration of electrophysiology and cardiomechanics. [doi:10.1113/JP283974](https://doi.org/10.1113/JP283974), [PubMed 37641426](https://pubmed.ncbi.nlm.nih.gov/37641426/).
24. Barbier P, Solomon SB, Schiller NB, Glantz SA. Left atrial relaxation and left ventricular systolic function determine left atrial reservoir function. [doi:10.1161/01.CIR.100.4.427](https://doi.org/10.1161/01.CIR.100.4.427), [PubMed 10421605](https://pubmed.ncbi.nlm.nih.gov/10421605/).
