# 4腔 Land–TriSeg 生理作動点 envelope v1

## 1. 目的と位置づけ

本書は、4腔 One-Fiber + Land active-only + 平衡受動材料 + 1状態SLS + TriSeg + 閉鎖循環モデルを、**数値的に成立する project-synthetic fixture** から、**文献に照らして妥当な正常成人の作動点**へ移すための実装・実験契約を定義する。

この段階で解くべき問題は、心房PVループの形を直接合わせることではない。優先順位は次である。

1. 血液量保存、数値収束、period-1を成立させる。
2. 全身・肺循環の圧、心拍出量、平均心房圧を成立させる。
3. 4心腔の実血液容積を成人CMR範囲へ置く。
4. 4弁の開閉、正味拍出量、圧較差、逆流を成立させる。
5. 房室流入と肺静脈流を二次的整合性として確認する。
6. その後で初めて、LA/RA PVループをhold-out観測量として読む。

機械可読な正本は [`normalAdultTargetPackV1.ts`](../../../engine/myocardium/fourChamberV1/physiology/normalAdultTargetPackV1.ts) とする。本書とtarget packの値が食い違う場合は、同一PR内で差異を解消し、暗黙にどちらかを優先してはならない。

### 1.1 本書が確立しないこと

本書とtarget packの追加だけでは、次を確立しない。

- 正常ヒト較正の達成。
- 患者固有fitまたはパラメータの一意同定。
- `ModelCore`／browser runtimeへの採用。
- LandまたはSLSパラメータの再同定。
- 心房PVループの形態的合格。
- AVPD、MAPSE、TAPSE、組織Dopplerの力学状態としての導入。

## 2. 今回の設計判断

### 2.1 心房 v-loop を目的関数にしない

心房PVループは、心房壁だけで決まらない。実血液容積、静脈還流、房室弁流、心室弛緩、心房活性化、心膜圧、Land履歴、SLS履歴が同時に作る結果である。その形、自己交差数、lobe面積を先に目的関数へ入れると、血管・解剖・弁・組織の誤りを別のパラメータで補償できてしまう。

したがってv1では、LA/RA PVループについて以下をすべて固定する。

- parameter fitに使用しない。
- candidate rankingに使用しない。
- 必須自己交差数を置かない。
- 必須lobe面積を置かない。
- SLS-offで8の字を保持することを要求しない。
- mockまたは白背景reference loopを数値targetとして使用しない。

これは心房PVループを重要でないと扱う判断ではない。**循環論的・構成則的に独立な検証へ回すためのhold-out**である。

### 2.2 動的AV-planeをこの作動点探索へ入れない

別の一般化座標 (z_M) を導入し、

$$
M_z\ddot z_M+C_z\dot z_M+
\frac{\partial\Psi_z}{\partial z_M}
=F_{z_M}^{\mathrm{wall}}
$$

のようなAV-plane力学を加える案は、このphaseでは採用しない。独立なAV-plane変位、速度、心房長軸ひずみ、弁輪牽引の同時データがないまま導入すると、収縮期のx谷を改善できる一方、心室拡張期には反対向きの幾何負荷が心房へ戻り、conduit pathを押し上げる自由度にもなる。この符号反転はユーザーが指摘した問題そのものであり、単純なばね・質量・ダンパーの調整では一意に解けない。

AVPD、MAPSE、TAPSE、s'、a'は将来のobserver候補ではあるが、**現在の一般化座標・状態から計算可能とはみなさない**。現モデルには、弁輪の長軸変位、心尖基部軸、組織Doppler速度へ一意に写像できる幾何座標がなく、これらは現状 `unrepresented/unavailable` である。独立な長軸方向の計測と仕事共役な3次元縮約を導入できる段階になって初めて、computed observerの定義、またはdynamic AV-planeを競合topologyとして再検討する。

### 2.3 LandとSLSをv-loopの修復つまみにしない

- Landはactive-onlyの6状態モデルを保持し、巨視的な直列弾性要素を追加しない。
- 平衡受動材料はLandから独立させる。
- SLS-onを正準full-model候補、SLS-offを構造的因果アブレーションとする。
- 正常作動点を作る今回の探索では、Landの細胞速度論とSLSの組織パラメータを固定する。
- SLS-on/offの心房ループ差は報告するが、どちらのトポロジーも事前に合否へ使わない。

Land 2017はヒト心室心筋の長さ・速度・カルシウム依存履歴を持つコンパクトな能動モデルを与える（[Land et al., 2017](https://doi.org/10.1016/j.yjmcc.2017.03.008)）。心房への適用は外挿であり、Land–Niedererの心房候補（cycling-rate倍率3、$Ca_{T50}^{ref}=0.86\,\mu\mathrm M$）も固定されたヒト真値ではない（[Land & Niederer, 2018](https://doi.org/10.1002/cnm.2931)）。最近のヒトLA/LV線維データはLAのより速い張力再発達と弱い長さ依存活性化を支持するが、追加OFF-stateを持つ派生モデルの微視的parameterを現行6状態Landへ直接移植できない（[Lewalle et al., 2026](https://doi.org/10.1016/j.yjmcc.2025.12.001)）。よって、組織parameter変更は独立component protocolを通す別phaseとする。

## 3. 固定する数理モデル本体

### 3.1 8区画閉鎖循環

血液区画を

$$
\mathcal C=\{LA,LV,SA,SV,RA,RV,PA,PV\}
$$

とし、流れの正方向を

$$
PV\xrightarrow{Q_{PV}}LA\xrightarrow{Q_{MV}}LV
\xrightarrow{Q_{AoV}}SA\xrightarrow{Q_{sys}}SV
\xrightarrow{Q_{VC}}RA\xrightarrow{Q_{TV}}RV
\xrightarrow{Q_{PuV}}PA\xrightarrow{Q_{pul}}PV
$$

とする。保存式は

$$
\begin{aligned}
\dot V_{LA}&=Q_{PV}-Q_{MV},&
\dot V_{LV}&=Q_{MV}-Q_{AoV},\\
\dot V_{SA}&=Q_{AoV}-Q_{sys},&
\dot V_{SV}&=Q_{sys}-Q_{VC},\\
\dot V_{RA}&=Q_{VC}-Q_{TV},&
\dot V_{RV}&=Q_{TV}-Q_{PuV},\\
\dot V_{PA}&=Q_{PuV}-Q_{pul},&
\dot V_{PV}&=Q_{pul}-Q_{PV}.
\end{aligned}
$$

したがって

$$
\frac{d}{dt}\sum_{c\in\mathcal C}V_c=0.
$$

血液量projection、負容積clamp、隠れたreservoir、結果依存のvolume correctionは禁止する。総血液量はparameterであり、保存則の事後修復量ではない。

### 3.2 血管圧–容積関係と末梢流

v1では血管区画の初期作動点を、最小の線形complianceで構成する。

$$
P_i=P_{ext,i}+\frac{V_i-V_{0,i}}{C_i},
\qquad i\in\{SA,SV,PA,PV\},
$$

$$
Q_{sys}=\frac{P_{SA}-P_{SV}}{R_{sys}},
\qquad
Q_{pul}=\frac{P_{PA}-P_{PV}}{R_{pul}}.
$$

これは正常成人作動点の最初のモデルであり、病的肺血管recruitment、圧依存compliance、分布遅延までこのphaseで追加しない。単純モデルが複数負荷で系統的に破綻したときだけ拡張する。

### 3.3 弁・静脈入口の運動量式

4弁と2静脈入口は、符号付き慣性流れとして同一時刻レベルで解く。

$$
L_j\dot Q_j
=\Delta P_j-R_jQ_j-B_jQ_j|Q_j|,
$$

ここで

$$
\Delta P_j=P_{up,j}-P_{down,j}.
$$

弁の開放面積、微小逆流面積、慣性、線形損失、二乗損失、開閉遷移は弁ownerが持つ。弁流を後処理で零へ切り捨てない。圧のspikeだけでなく、同時刻の流れ、持続時間、正味順行容積、逆流容積を組として評価する。

### 3.4 壁応力

各壁の線維Kirchhoff応力は

$$
\tau_f
=\tau_\infty(e_f)
+\tau_{Land}(\mathbf y_{Land},Ca_i,\lambda_L)
+q_v,
$$

$$
q_v=E_v(e_f-\alpha_v),
\qquad
\dot\alpha_v=\frac{e_f-\alpha_v}{\tau_v}.
$$

とする。平衡受動エネルギー、Land active-only、SLS超過応力の責任を分離し、二重計上しない。SLS散逸は

$$
\mathcal D_v
=V_{w0}\frac{q_v^2}{E_v\tau_v}\ge0
$$

であり、数値的な圧平滑化ではない。

### 3.5 LA/RA one-fiber

心房 $A\in\{LA,RA\}$ の中壁包囲容積と線維ひずみを

$$
V_{m,A}=V_A+\frac12V_{w,A},
$$

$$
e_{f,A}=\frac13\log\frac{V_{m,A}}{V_{m,A,ref}}
$$

とする。仮想仕事から

$$
P_A^{tm}\,\delta V_A
=V_{w,A}\tau_{f,A}\,\delta e_{f,A},
$$

$$
\boxed{
P_A^{tm}
=\frac{V_{w,A}}{3V_{m,A}}\tau_{f,A}
}
$$

を得る。経験的な心房圧gainや追加Laplace係数は置かない。絶対圧は

$$
P_A=P_A^{tm}+P_{th}+P_{peri}
$$

とし、外圧の所有権を明示する。

### 3.6 LV/SEP/RV TriSeg

循環が供給する $V_{LV},V_{RV}$ に対し、TriSegは中隔中壁容積と接合半径

$$
q_g=(V_{m,S},y_m)
$$

を代数未知数として解く。各壁 $p\in\{LVFW,SEP,RVFW\}$ について、内部平衡は選択したTriSeg assemblyの一般化力

$$
G_j
=\sum_pV_{w,p}\tau_{f,p}
\frac{\partial e_{f,p}}{\partial q_j}
$$

を用い、

$$
G_{V_{m,S}}=0,
\qquad
G_{y_m}=0
$$

で解く。公表Taylor形式とvirtual-work候補を混在させない。心室圧、TriSeg内部力、壁powerの符号規約は既存の4腔モデル仕様に従い、この作動点探索のために変更しない。

## 4. 生理作動点の構成

### 4.1 流量と抵抗を先に決める

候補心拍出量 $CO^*$ から平均流量を

$$
Q^*=\frac{1000}{60}CO^*
\quad[\mathrm{mL/s}]
$$

とする。次に、目標平均圧から

$$
R_{sys}^{(0)}
=\frac{MAP^*-P_{SV}^*}{Q^*},
\qquad
R_{pul}^{(0)}
=\frac{mPAP^*-P_{PV}^*}{Q^*}
$$

を得る。

単位換算は

$$
1\ \mathrm{mmHg\,s/mL}
=16.6667\ \mathrm{mmHg/(L/min)}
=1.33322\times10^8\ \mathrm{Pa\,s/m^3}
$$

である。たとえば、$CO^*=5.5\,\mathrm{L/min}$、$MAP^*=90\,\mathrm{mmHg}$、$P_{SV}^*=3\,\mathrm{mmHg}$ なら

$$
Q^*=91.667\ \mathrm{mL/s},
\qquad
R_{sys}^{(0)}=0.949\ \mathrm{mmHg\,s/mL}.
$$

$mPAP^*=14\,\mathrm{mmHg}$、$P_{PV}^*=9\,\mathrm{mmHg}$ なら

$$
R_{pul}^{(0)}=0.0545\ \mathrm{mmHg\,s/mL}.
$$

これらはclosed-loop反復の初期値であり、結果から逆算した後に文献値と称するものではない。

### 4.2 complianceとunstressed volume

動脈complianceの初期推定は

$$
C_{SA}^{(0)}\simeq\frac{SV}{PP_{sys}},
\qquad
C_{PA}^{(0)}\simeq\frac{SV}{PP_{pul}}
$$

とし、実際には弁流波形と末梢流の差を積分するWindkessel整合性で確認する。各区画の作動点が $(V_i^*,P_i^*)$ のとき、

$$
V_{0,i}=V_i^*-C_i(P_i^*-P_{ext,i})
$$

である。$V_0$ は圧targetを後から満たすための無制限offsetではなく、血液量配分と一体で解く。

総血液量 $V_{TBV}$ を固定した後の残差は、主として大容量静脈区画が所有する。現在の実装centerは、pressure-preserving warm startを一意かつ監査可能に構築するため、**初期化時に限り**非SV 7区画をsource値に保ち、TBV残差の全量をSVへ置く。同時に上式から $V_{0,SV}$ を再導出し、sourceの初期SV圧を保つ。

これは生理的な定常血液分布を受理したという主張ではなく、`initial-pressure-preserving-bootstrap-only` である。periodic runの心腔・血管容積または圧gateが不合格なら、そのcenterを棄却し、宣言した複数区画への初期配分と各 $V_0$ を再構築する。失敗後に状態へvolumeを加減するprojectionは行わない。「余剰血液を1区画へ隠さない」とは、SV bootstrapだけでTBV gateを通したことにしたり、圧・容積不合格のままその配分を固定したりしない、という意味である。

特に、このbootstrapでTBVだけを変えて

$$
V_{SV}\leftarrow V_{SV}+\Delta V,
\qquad
V_{0,SV}\leftarrow V_{0,SV}+\Delta V
$$

とすると、$P_{SV}=(V_{SV}-V_{0,SV})/C_{SV}+P_{ext}$ は不変である。これはpressure-preservingなnull-space移動であってpreload摂動ではない。したがって、実装protocolはTBVのone-at-a-time bracketを `disabled-unavailable` とし、区画ごとのstressed-volume配分と$V_0$ policyが宣言されるまでpreload sweepとして公開しない。

### 4.3 実装center v1

現在の `normal-adult-center-sls-on-v1` は、最適解でも較正済み正常値でもなく、探索の結果、period-1と正常作動点gateを満たさなかった **failed/rejected exploratory candidate** である。下表は再現とfailure localizationのために残すが、受理済みcenterまたは探索中心としては扱わない。次のownerはStage 0 `numerical closure / initialization` であり、phase-consistentな複数区画初期配分とperiodic closureをprojectionなしで成立させる。

| parameter | SI実装値 | 臨床単位での概算 |
|---|---:|---:|
| TBV | $5.6\times10^{-3}\,\mathrm{m^3}$ | 5.6 L |
| $R_{sys}$ | $1.25\times10^8\,\mathrm{Pa\,s/m^3}$ | 0.938 mmHg s/mL = 15.6 mmHg/(L/min) |
| $R_{pul}$ | $1.10\times10^7\,\mathrm{Pa\,s/m^3}$ | 0.0825 mmHg s/mL = 1.38 mmHg/(L/min) |
| $C_{SA}$ | $11.25\times10^{-9}\,\mathrm{m^3/Pa}$ | 1.50 mL/mmHg |
| $C_{SV}$ | $750\times10^{-9}\,\mathrm{m^3/Pa}$ | 100 mL/mmHg |
| $C_{PA}$ | $30\times10^{-9}\,\mathrm{m^3/Pa}$ | 4.00 mL/mmHg |
| $C_{PV}$ | $112.5\times10^{-9}\,\mathrm{m^3/Pa}$ | 15.0 mL/mmHg |
| MV / AoV open area | $5.0/3.5\times10^{-4}\,\mathrm{m^2}$ | 5.0 / 3.5 cm² |
| TV / PuV open area | $8.0/4.0\times10^{-4}\,\mathrm{m^2}$ | 8.0 / 4.0 cm² |
| $R_{VC}$ / $R_{PV,in}$ | $5.33/4.03\times10^6\,\mathrm{Pa\,s/m^3}$ | 0.0400 / 0.0302 mmHg s/mL |

弁面積はmodelのopen-area／EOA候補であり、画像で測定したanatomic orifice areaまたはDoppler EOAと同一だとは主張しない。centerはSLS-on warm startだけを許し、壁geometry、壁材料容積、Land細胞parameter、平衡受動材料、SLS parameter、Ca event scheduleを固定する。dynamic AV-plane stateは持たない。

runnerの既定 $\Delta t=4$ msは、計算可能性とfailure localizationのための**探索専用・非証拠**設定である。正式なperiod-1 protocolが現在支持する刻みは1、0.5、0.25 msだけであり、4 ms runでは `formalPeriodicProtocol=false`、`formalPeriodicEvidenceEligible=false`、`exploratoryTimeStep=true` とする。4 msの波形、target判定、checkpointは、正常作動点、periodicity、timestep convergence、生理学的妥当性の証拠に昇格できない。

### 4.4 単一点ではなく連結したenvelopeを要求する

preferred centerは文献上のoutcome anchorであり、現行failed candidateやscalar lossの最小点ではない。将来受理される候補は、1つの偶然の組合せだけでなく、正常範囲内の心拍数・後負荷、および宣言済みmulticompartment stressed-volume policyに基づく前負荷の小さな摂動に対して、正容積、保存、period-1、圧、拍出量、弁開閉を維持する**連結した作動領域**を持つ必要がある。

## 5. 正常成人target pack v1

対象は安静、洞調律、概ねeuvolemicな成人、BSA文脈 $1.5$–$2.3\,\mathrm{m^2}$ とする。妊娠、競技者remodeling、AF／非洞調律pace、軽度を超える弁膜症、既知の肺高血圧、先天性shunt／術後循環はこのpackの対象外である。

### 5.1 Global hemodynamics — primary

| 観測量 | broad range | preferred center | 備考 |
|---|---:|---:|---|
| HR | 60–100 bpm | 75 | AHAの「most adults」に整合するprimary corridor。低値は活動・薬剤文脈を別宣言 |
| systemic SBP | 100–130 mmHg | 120 | central model pressureと比較 |
| systemic DBP | 60–85 mmHg | 80 | broad operating corridor |
| MAP | 75–100 mmHg | 90 | period-1 cycle mean |
| CO | 4–8 L/min | 5.5 | 体格依存 |
| mean RAP | 0–6 mmHg | 3 | 外圧zeroを明示 |
| mean LAP | 4–13 mmHg | 9 | PAWPはsurrogateであり恒等ではない |
| PA systolic | 15–35 mmHg | 25 | catheter条件依存 |
| PA diastolic | 4–15 mmHg | 9 | lumped PAと測定位置は異なる |
| mean PAP | 10–20 mmHg | 14 | 20は上限であり調整中心ではない |
| LVEDP | 5–15 mmHg | 10 | event-local値 |
| RV peak pressure | 15–40 mmHg | 25 | 肺動脈弁開放・駆出を伴うこと |
| TBV | 4000–7000 mL | 5600 | construction context。体格式を優先 |

左右の**符号付き正味拍出量**の不一致率は5%以下とする。これは単なる生理targetではなく、period-1閉鎖循環の整合性でもある。

### 5.2 Chamber volumes — primary unless noted

| 心腔 | EDV／max | ESV／min | SV／cyclic emptying | EF／total emptying fraction |
|---|---:|---:|---:|---:|
| LV | 78–215 mL | 21–85 mL | 52–145 mL/beat | 0.49–0.79 |
| RV | 68–244 mL | 13–117 mL | 39–146 mL/beat | 0.45–0.80 |
| LA | max 28–115 mL | min 6–50 mL | 19–73 mL/beat | 0.38–0.78（secondary） |
| RA | max 24–158 mL | min 9–84 mL | 23–90 mL/beat | 0.29–0.77（secondary） |

これらはsex、年齢、BSA、contour、appendage、papillary-muscleの扱いが異なる成人CMR報告の広いunionであり、患者固有正常値ではない。同一の収束拍から全extremaを取り、SVは弁の正味積分流量と整合しなければならない。EFはEDV/ESVから導かれるため、独立の自由度としてfitしない。

### 5.3 Valve and venous flow — secondary consistency

4弁は1拍中にforward-open区間とclosed区間を持ち、各弁の正味順行容積は40–145 mL/beat、逆流率は5%以下とする。

| 弁 | forward mean gradient | forward peak gradient |
|---|---:|---:|
| mitral | 0–3 mmHg | 0–6.5 mmHg |
| aortic | 0–15 mmHg | 0–25 mmHg |
| tricuspid | 0–3 mmHg | 0–7 mmHg |
| pulmonary | 0–5 mmHg | 0–10 mmHg |

これらは疾患閾値を避けるための保守的な0D operational corridorであり、健常Doppler reference intervalではない。modelの同時刻圧較差とDoppler速度からの圧較差を同一視しない。

房室流入はmitral E/A 0.6–2.0、tricuspid E/A 0.6–2.2を文献上の二次contextとする。90 bpm以下では早期・後期順行成分の分離を期待するが、E/A単独を正常判定に使わない。

肺静脈流はS、D、Arを必ず別々に報告する。systolic forward fractionは0.35–0.75、Arの総順行容積に対する逆行容積率は0–0.10を二次corridorとする。peak timingや形そのものはparameter fitに使用しない。

現行実装のE/AおよびS/D/Arは、schedule phaseに固定した窓で流量を分割する**探索的なsecondary readback**である。臨床Doppler eventへのmapping、弁eventに追随する窓、peak velocityと0D volume flowの対応はいずれもvalidationされていない。このためfixed-window値は正常受理gate、parameter fit、candidate rankingに参加せず、波形のfailure localizationだけに用いる。

## 6. 現在のproject-synthetic fixtureとの境界

既存のPhase B1 periodic artifactは、数値積分、保存、event、Land/SLS/TriSeg結合を検証するための対称test fixtureであり、正常成人baselineではない。対称scaffoldの初期TBVは約2.374 Lである。2026-07-16の1 ms terminal waveformでは、SLS-onでおおよそ次を示す。

- LA 1.83–56.4 mL、RA 5.11–65.6 mL。
- LV peak 20.7 mmHg、RV peak 21.7 mmHg。
- systemic artery 9.6–13.8 mmHg。

これは、LA/RA最小容積、LV駆出圧、systemic operating pointがtarget packより先に破綻していることを示す。したがって、そのfixtureのPVループを維持したまま局所的にv-loopだけを拡大することは目標にしない。fixtureは数値回帰として保持し、生理作動点caseを別に構築する。

## 7. 心房 v-loop の数理的readback

### 7.1 matched-volume圧差

reservoir branchとconduit branchが共有する容積区間を

$$
\mathcal I_V=[V_-,V_+]
$$

とする。v-lobeの符号付き面積は、向きの規約を固定すれば

$$
A_V
=\int_{V_-}^{V_+}
\left[P_{res}(V)-P_{con}(V)\right]dV
=\Delta V_{overlap}\,\overline{\Delta P_{R-C}},
$$

$$
\Delta V_{overlap}=V_+-V_-.
$$

したがって、v-loop不足は、共有容積幅 $\Delta V_{overlap}$ の不足と、同一容積での上下圧差 $\overline{\Delta P_{R-C}}$ の不足へ必ず分けて評価する。Land/SLSは主に後者へ作用し、PV filling、LV ejection time・relaxation、MV opening・inertanceは両者へ作用しうる。

心房圧は

$$
P_A(t)=P_{ext,A}(t)
+\kappa_A(V_A(t))
\left[
\tau_\infty(t)+\tau_{Land}(t)+q_v(t)
\right],
$$

$$
\kappa_A(V)=\frac{V_{w,A}}{3(V+V_{w,A}/2)}.
$$

同じ容積 $V^*$ を通るreservoir時刻 $t_R$ とconduit時刻 $t_C$ を比較すると、

$$
\Delta P_{R-C}(V^*)
=P_A(t_R)-P_A(t_C).
$$

自己相似one-fiber幾何では同一 $V^*$ なら $e_f$ も同一なので、理想的には平衡受動応力差はゼロである。したがって

$$
\Delta P_{R-C}(V^*)
\approx
\kappa_A(V^*)
\left[
\Delta\tau_{Land}
+\Delta q_v
\right]
+\Delta P_{ext}.
$$

この式はv-loopの上下分離を、少なくとも次の3成分へ分ける。

1. Land active history。
2. SLS history。
3. 心膜／胸腔外圧。

SLS-offでは $\Delta q_v=0$ だが、Land状態履歴と流量時相が残るので、ループが生成・維持・消失のどれになるかは結果である。8の字保持を要求しない。

### 7.2 容積方向の不足と圧方向の不足を分ける

v-loopが小さいとき、単一の「loop area不足」として扱わず、次を分けて診断する。

- **reservoir volume不足:** 房室弁閉鎖中の $\int(Q_{PV}-Q_{MV})dt$ または $\int(Q_{VC}-Q_{TV})dt$ が小さい。
- **conduit emptying不足:** 房室弁開放中の正味心房流出が小さい、または心室弛緩と静脈流入の位相が不整合。
- **matched-volume圧差不足:** $\Delta\tau_{Land}$、$\Delta q_v$、$\Delta P_{ext}$ のいずれかが小さい。
- **誤った上下関係:** conduit時の心房壁stressまたは外圧がreservoir時より高い。dynamic AV-planeを追加して符号を反転させる前に、各成分を直接監査する。

### 7.3 hold-outで必ず出力するもの

global、volume、valve/PV-flow gate通過後、LA/RAごとに次を出力する。

- periodicな実血液容積–絶対圧polyline。
- 符号付き面積、絶対面積、自己交差点、交差角。
- matched-volume reservoir-minus-conduit pressure separation。
- equilibrium-passive、Land-active、SLS、external/pericardialの圧帰属。
- 静脈流入、房室弁流、弁event、心房・心室activationとの位相関係。

いずれもこのphaseでは合否またはcandidate rankingに使わない。

## 8. Parameter ownershipと変更順序

同時に全parameterを最適化しない。各stageは以前のgateを保持し、下流ownerが上流missを補償してはならない。

| stage | owner | 変更してよいもの | 補償に使ってはいけないもの |
|---:|---|---|---|
| 0 | numerical closure / initialization | continuation、Newton scale、tolerance、dt、event split、phase-consistent initial state | physiology missを数値damping、clamp、projectionで隠すこと |
| 1 | vascular operating point | TBV、血管$V_0$、$R_{sys/pul}$、血管$C$、初期血液配分 | 壁解剖、Land、SLS、心房PV topology |
| 2 | anatomical wall geometry | LA/RA wall・reference cavity、LVFW/SEP/RVFW wall volume・reference area、anatomy-owned pericardial reference | 血管圧miss、弁狭窄、PV-loop形態 |
| 3 | valve hydraulics | open/leak area、$R/L/B$、開閉遷移 | active capacity、relaxation、PV-loop形態 |
| 4 | activation / relaxation | 根拠あるevent timing、独立に拘束したCa relaxation、組織実験で限定したmacro transmission | 血管、解剖、PV-loop面積／topology |
| 5 | held-out observers | なし | あらゆるparameterまたは状態方程式 |

解剖referenceを、静止時の全心腔圧を等しくするinverse problemから作らない。壁容積、基準面積、心膜referenceは解剖ownerが持ち、血管の$V_0$と区別する。

## 9. 段階的実験計画

### P0 — 数値基盤を凍結する

既存のproject-synthetic regressionを残し、生理caseと混同しない。各SLS modeで以下を通す。

- 全8血液容積が有限かつ正。
- incidence ledgerによるTBV保存。
- Land population、SLS状態、TriSeg rootの健全性。
- 数値projection、clipping、fallbackなし。
- event transactionとmechanical ledgerの既存gate。
- 連続3周期のperiod-1と全edge符号付き平均流量一致。

### P1 — vascular operating point

1. HR、体格文脈、TBVを宣言する。
2. $CO^*$、MAP、RAP、LAP、mPAPを選び、$R_{sys}^{(0)},R_{pul}^{(0)}$を解析的に初期化する。
3. pulse pressureと流量から$C_{SA},C_{PA}$を初期化する。
4. $V_0$と血液量配分を同時に解く。
5. Land、SLS、壁geometry、弁parameterを固定したclosed loopをperiod-1まで回す。
6. global hemodynamicsを評価し、失敗はvascular owner内でのみ修正する。

P1では心房PV loopを表示してよいが、選択に使わない。

### P2 — anatomical chamber-volume envelope

P1を維持したまま、CMRに基づくLV/RV/LA/RA容積corridorへ入れる。変更は壁材料容積、reference cavity volume、TriSeg reference area、anatomy-owned pericardial referenceに限定する。

各候補で次を同時に要求する。

- EDV/max、ESV/min、SV/cyclic emptying、EF/emptying fraction。
- 同一拍の弁積分流量との整合。
- chamber minimumを作る人工clampなし。
- global hemodynamics gateの保持。

### P3 — valve hydraulics

4弁のopen/leak area、inertance、loss、transitionを調整し、各弁のforward-open/closed interval、正味拍出、逆流、mean/peak gradientを成立させる。圧spikeはevent直後の数値transientと持続gradientを分けて報告する。

P3の変更でP1/P2を外れた候補は棄却し、下流で補償しない。

### P4 — activation and relaxation

P1–P3通過後に限り、房室流入E/A、肺静脈S/D/Ar、心房・心室の収縮／弛緩時相を確認する。この段階でも、PV-loop形態を目的関数にしない。

変更候補は次に限定する。

- ECG／弁event／tissue protocolにより拘束されたactivation timing。
- 独立Ca transientまたはtwitch dataにより拘束されたprescribed-Ca relaxation。
- isolated tissue protocolを通過したactive transmission scale。

Land微視的速度定数、$T_{ref}$、Ca振幅、viable fractionを同時に自由化しない。心房candidateを比較する場合は、同一Ca・同一strain protocolでisometric twitch、length-step、restretch、$k_{tr}$を先に比較し、その結果をclosed loopのv-loop shapeから独立させる。

### P5 — held-out atrial PV readback

P1–P4通過候補だけを対象に、7節のLA/RA readbackを実施する。SLS-on/off、atrial activation-on/offを同一位相・同一解析規約で比較する。結果は因果帰属であり、合否判定ではない。

この段階でv-loopが小さい、潰れる、上下関係が逆になる場合は、matched-volume分解と流量積分により原因ownerを特定し、該当ownerの根拠を増やす。形を見てLand/SLSを直接再fitしない。

### P6 — robustness and disease-axis stress tests

正常中心だけでなく、run前に固定したmatrixで調べる。

- timestep: 1、0.5、0.25 ms。
- HR: 60、75、90 bpm。
- TBV／preload: 現在は `disabled-unavailable`。宣言済みmulticompartment stressed-volume allocationと$V_0$ policyを実装した後にだけ範囲を事前登録する。
- systemic resistance: nominalの$\pm20\%$。
- pulmonary resistance: normal付近と、PH方向の段階増加。
- SLS-on/off、atrial activation-on/off。

正常pack外の摂動は正常合否に使わず、方向性と数値的生存域を調べる。PHではmPAP/RV圧上昇、中隔偏位、RV拍出低下の整合した傾向を、HFpEF方向では充満圧、容積、弛緩、心膜負荷を別軸として評価する。弁膜症は弁owner、AFはactivation schedule ownerで導入し、単一の「疾患severity」つまみに潰さない。

### P7 — 条件付きmodel-class拡張

P1–P4を満たす連結した作動領域を得ても、P5でv-loopが一貫して狭い、またはreservoir/conduitの上下関係が逆であり、matched-volume解析が固定shapeの不足を支持した場合に限り、次の競合topologyへ進む。

第一候補は、各心房に最大1個の非self-similar shape coordinate $s_A$ を持つ画像由来shape-mode replayである。

$$
e_{f,A}=e_{f,A}(V_A,s_A),
$$

$$
\delta W_A
=P_A^{tm}\delta V_A+F_{s,A}\delta s_A
=V_{w,A}\tau_{f,A}\delta e_{f,A},
$$

$$
P_A^{tm}
=V_{w,A}\tau_{f,A}
\left.\frac{\partial e_{f,A}}{\partial V_A}\right|_{s_A},
\qquad
F_{s,A}
=V_{w,A}\tau_{f,A}
\left.\frac{\partial e_{f,A}}{\partial s_A}\right|_{V_A}.
$$

最初の比較では、$s_A(t)$ を同時画像の面積・長軸径・短軸径から規定し、PV-loopからfitしない。規定shapeが行う外部power $F_{s,A}\dot s_A$ はmechanical ledgerへ明示する。独立データなしに質量–ばね–ダンパーを付け、自由なdynamic stateとして調整してはならない。

shape-modeでも説明できず、肺静脈入口と心房bodyの間に再現可能な圧・流量位相差の根拠がある場合だけ、保存的なatrial port／distributed-inflow stateを次候補とする。複数SLS時定数は、複数速度・複数負荷の独立組織データが単一SLSを棄却した後の最後の候補である。

P7の競合modelは、画像shape／strain、弁・静脈流、圧のhold-out改善で比較する。心房PV-loop形態単独で複雑なmodelを選ばない。

## 10. 受理順序とfailure policy

受理順序は固定する。

1. `numerical-integrity`
2. `blood-volume-conservation-and-period-1`
3. `global-hemodynamics`
4. `chamber-volume-envelope`
5. `valve-and-pulmonary-venous-flow`
6. `held-out-observers`

後段を評価するためには前段がすべて通過していなければならない。全targetを1つのweighted scalar scoreに縮約せず、candidateの総合順位も作らない。失敗は最初に外れたgateとownerへ返す。

### 10.1 即時棄却条件

- 1拍cold-startだけの評価。
- period-1未収束。
- TBV projection、負容積clamp、隠れたvolume source。
- 左右の正味拍出不一致を血液量driftで吸収。
- 弁が1拍を通して開きっぱなし、または閉じっぱなし。
- 圧spikeだけが範囲内で、対応するejection／fillingがない。
- anatomy parameterでvascular missを修正。
- valve parameterでactive capacity／relaxation missを修正。
- Land／SLSを心房PV-loop形状だけで修正。
- mock/reference loopを目標にした形状fitting。

### 10.2 成功の意味

このprogramの最初の成功は、**固定された組織構成則のもとで、正常成人のglobal hemodynamics、4心腔容積、弁／肺静脈流の広いcorridorを同時に満たす、保存的かつperiodicな4腔作動点caseを得ること**である。

それでも、正常ヒトvalidation、patient fit、Land/SLS同定、v-loop形態受理、runtime採用は別のclaimである。

## 11. 根拠と測定上の注意

- 成人CMR容積: [Kawel-Boehm et al., 2020](https://doi.org/10.1186/s12968-020-00683-3)。sex、年齢、BSA、contour、appendage／papillary-muscleの扱いに依存する。
- 健常安静mPAP: [Kovacs et al., 2009](https://doi.org/10.1183/09031936.00145608)。pooled meanは$14.0\pm3.3$ mmHgで、年齢・姿勢・呼吸規約に依存する。
- 健常PAWP: [Zeder et al., 2024](https://doi.org/10.1183/13993003.00967-2024)。pooled meanは$9.4\pm1.82$ mmHg、上限は概ね13 mmHgだが、PAWPとmodel LAP/LVEDPは恒等ではない。
- RHC broad corridorと測定解釈: [Right heart catheterization review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10352814/)。zeroing、damping、呼吸平均、Fick／thermodilutionに依存する。
- E/A、肺静脈S/D/Ar: [ASE/EACVI 2016](https://doi.org/10.1016/j.echo.2016.01.011)。年齢、rhythm、loading、LVEF、弁疾患に依存し、単一指標で正常性を決めない。
- 弁疾患閾値: [2020 ACC/AHA valve guideline](https://doi.org/10.1161/CIR.0000000000000923)。疾患severity thresholdであり、健常reference intervalではない。
- 血圧文脈: [2017 ACC/AHA blood-pressure guideline](https://doi.org/10.1161/HYP.0000000000000065)。brachial cuffとmodel central pressureを同一視しない。
- 安静HR文脈: [American Heart Association](https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates)。多くの成人は60–100 bpmで、運動習慣・薬剤により範囲外となる場合は別のpopulation contextとして扱う。
- 体格依存TBV: [Nadler et al.](https://pubmed.ncbi.nlm.nih.gov/21936146/)。height、weight、sex、pregnancy、hydrationに依存する。
- 既存project baselineは内部regressionであり、生物学的validationではない。historicalなfigure-eight／loop-area gateは本target packへ輸入しない。

## 12. center v1 の探索結果と次の判定

`normal-adult-center-sls-on-v1` を既定の4 msで13周期まで積分した探索artifactは、**総血液量保存の単独readbackを満たすが、period-1を満たさないfailed/rejected negative result**である。機械可読reportは [`phase-b1-physiology-envelope-center-sls-on-v1.json`](../../../data/myocardium/reports/phase-b1-physiology-envelope-center-sls-on-v1.json)、視覚readbackは [`phase-b1-physiology-envelope-center-sls-on-v1.html`](../../../data/myocardium/visuals/phase-b1-physiology-envelope-center-sls-on-v1.html) に保存する。4 msは正式刻みではなく、terminal statusも `formalPeriodicStatus=not-run-exploratory-dt` である。さらにperiod target不合格のため `inputEligibilityPass=false`、`physiologyBandComparisonStatus=provisional-period-target-not-passed` であり、以下の圧・拍出量・容積・充満比較はfailure localization用の**暫定readback**に限る。正常作動点の合否、生理学的validation、またはtimestep convergenceの証拠には使用しない。

| 観測量 | 13周期目の暫定readback | prospective corridor／解釈 |
|---|---:|---|
| maximum normalized endpoint distance | $1.287981\times10^{-2}$ | $\le 10^{-6}$に未到達、period target不合格 |
| maximum relative TBV drift | $4.646581\times10^{-16}$ | 単独の保存readbackは許容範囲内 |
| signed left / right CO | 2.7838 / 3.2350 L/min | `Q_AoV` / `Q_PuV` の符号付き正味積分値。暫定的にはともに4--8 L/min未満 |
| left--right signed-output mismatch | 14.99% | 暫定的には5%以下に未到達 |
| systemic pressure | 38.72--57.00、mean 48.29 mmHg | 暫定的には低い |
| mean LAP / RAP | 15.75 / 2.99 mmHg | 暫定的にはLAP高値、RAP範囲内 |
| mean PAP | 21.64 mmHg | 暫定的には正常corridorより高い |
| LV max / min / extrema-derived EF | 213.73 / 175.19 mL / 18.03% | Stage 2 supportive readback。maxは上限付近、min高値、EF低値 |
| RV max / min / extrema-derived EF | 91.62 / 47.52 mL / 48.13% | Stage 2 supportive readbackはbroad CMR corridor内 |
| mitral early filling | fixed window内のforward peak未分離 | E/A未解決。secondary exploratory readbackでありgate／fit／rankingには使わない |
| pulmonary venous S/D peak ratio | 6.526 | fixed windowではsystolic優位。Dopplerへの対応は未検証でありgate／fit／rankingには使わない |

最終endpoint差を支配するscalarは `Q_VC` である。終周期の区画別storage deltaもSV $-6.266$ mL、PV $+3.922$ mLであり、総和はほぼ零でも区画間の遅い血液再配分が残る。したがって、この13周期目からvascular operating pointやLand active capacityを原因と確定してはならず、Stage 1 global-hemodynamics screenにも進めない。**次ownerはStage 0 `numerical closure / initialization`** である。結果依存projectionを使わず、宣言済みの$V_0$ policyを伴うphase-consistentな複数区画初期配分とcontinuationにより、まずperiodic closureを成立させる。

正式刻みでperiod-1を通過した後にも、LV maxが上限付近のまま、低いsystemic pressure、低いsigned CO、高いLV min、低いextrema-derived EFが同時に残るなら、Stage 1のvascular operating pointを評価する。それでも残るmissをStage 1 parameterの過拡大で補償せず、Stage 2のreference geometry・wall volumeと、独立twitch protocolに拘束されたStage 4 active capacity／relaxationのどちらが不足するかを順序どおり分離する。LA/RA PV-loopはこの判断へ使用しない。

## 13. 最終claim boundary

このv1で固定するのは、文献に基づく**広いoutcome envelope**、parameter ownership、実験順序、hold-out境界である。

$$
\boxed{
\text{global hemodynamics}
\rightarrow
\text{chamber volumes}
\rightarrow
\text{valve/PV flow}
\rightarrow
\text{held-out atrial PV loops}
}
$$

心房v-loopが生理的に大きくなることを期待する理由は、形を直接合わせるからではない。正常なTBV、静脈圧、心拍出量、心腔容積、弁流、心房／心室弛緩を同じ保存系で成立させれば、reservoirとconduitが十分な容積差を持ち、Land/SLS履歴が同一容積で異なる圧を与えられるからである。その結果がなお不十分なら、matched-volume分解に基づいて不足した機序を特定し、独立根拠がある範囲だけモデルを拡張する。
