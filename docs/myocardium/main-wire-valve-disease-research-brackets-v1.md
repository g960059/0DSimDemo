# Main-wire four-valve disease research brackets V1

## 状態と結論

この文書は、main-wire由来の四心腔・二循環sidecarへ弁疾患を導入するための**科学仕様と検証契約**である。
24個の`mild`、`moderate`、`severe`は臨床診断research inputではなく、弁面積を順序付けした
**research bracket**である。文書、型、単体testが存在しても、周期解、疾患別hemodynamics、負荷envelope、
browser-visible runtimeへの採用まで完了したことを意味しない。

canonical V2は次の最小構造とする。

- 弁を跨ぐbulk flowは代数的な準定常orifice lawで求め、弁ごとのflow inertance stateを持たない。
- memory stateはbounded leaflet-opening fraction `xi`だけとする。
- favorable directionの最大effective orifice area（EOA）と、adverse directionの閉鎖時effective
  regurgitant orifice area（EROA）を別parameterにする。
- 臨床EOA/EROAを使う場合、discharge/contraction effectは既にeffective areaへ含まれるため、`Cd`を再度掛けない。
- competent closureでは物理EROAを厳密に0とできる。数値安定化用の面積floorを生理的leakとして公開しない。
- 24 bracket間ではhealthy baselineの弁opening/closing kineticsを固定し、狭窄はforward EOAだけ、逆流は
  closed reverse EROAだけを変更する。
- PSはperiodic solve後の`Vmax`/peak gradient、PRはregurgitant fraction（RF）で必ず再評価する。

この決定は、血液の慣性が物理的に存在しないという主張ではない。CircAdaptやMynard型モデルは弁flowを
ODE stateとして扱える。一方、現在の目的は四心腔・血管・弁のownerを分離した疾患research bracketであり、
未同定の弁内有効長とflow memoryを追加してMV/TV flowの非生理的な細かな多峰性を作るより、main-wireの
Ao--SAおよびPA--PArt側に既存のroot inertanceを残し、弁portを準定常損失に限定する。この簡約で失われる
閉鎖時water-hammer、inertial phase lag、詳細なdicrotic transientはlimitationsとして明示する。

## 短いevidence boundary

仕様、report、UIへ載せる最小文は次とする。

> This research input is a research bracket for an isolated acute valve lesion. It changes only effective forward or closed regurgitant area; it is not a diagnosis, patient-specific fit, or chronic-remodeling phenotype. Clinical grades are multiparametric and load dependent. PS and PR areas require post-solve calibration to Vmax/gradient and regurgitant fraction, respectively. Detailed jet geometry, pressure recovery, valve-port inertance, and dynamic annular or leaflet pathology are outside V2.

日本語では次の意味である。

> このresearch inputは孤立急性弁病変のresearch bracketであり、forward EOAまたはclosed EROAだけを変更する。臨床診断、患者fit、慢性remodeling phenotypeではない。臨床gradeは多指標かつ負荷依存である。PSとPRの面積はそれぞれVmax/gradientとRFによる周期解後の較正が必要で、jet形状、pressure recovery、弁port慣性、動的な弁輪・弁尖病変はV2の範囲外である。

## 変数、向き、単位

各弁の生理的forward directionを、MVはLAからLV、TVはRAからRV、AoVはLVからAo root、PVはRVから
PA rootとする。

$$
\Delta P=P_{upstream}-P_{downstream},
$$

$$
Q>0\quad\Longleftrightarrow\quad\text{forward flow}.
$$

native unitは圧`mmHg`、flow`mL/s`、面積`cm^2`、時間`s`である。血液密度は

$$
\rho=1060\ \mathrm{kg/m^3}
$$

をV2の固定値とする。

## V2の数理モデル

### Leaflet-opening memory

唯一のaccepted valve stateを

$$
0\le\xi\le1
$$

とし、`xi=0`を閉鎖、`xi=1`を最大開放と解釈する。圧駆動targetは、実装上の$C^1$ positive partを

$$
h(x;w)=
\begin{cases}
0,&x\le0,\\
x^2/(2w),&0<x<w,\\
x-w/2,&x\ge w
\end{cases}
$$

として

$$
\xi_\infty
=1-\exp\{-k_{open}h(\Delta P-d-P_0;w)\}
$$

で与える。$d$はhealthy topology由来のopening-drive deadband、$P_0$はoffset、$w$はconditioning widthで
あり、flow regularizationでも疾患gradeでもない。連続時間の意図は

$$
\dot\xi=\frac{\xi_\infty-\xi}{\tau},
\qquad
\tau=
\begin{cases}
\tau_{open},&\xi_\infty>\xi_{previous},\\
\tau_{close},&\text{otherwise}
\end{cases}
$$

で、Backward Eulerによりbounded updateする。疾患bracketは$k_{open}$、$d$、$P_0$、$w$、
$\tau_{open}$、$\tau_{close}$を変更しない。これらはMynardの
$\dot\xi\propto|\Delta P|$ lawと同じ式ではないため、文献の$K_{vo}$、$K_{vc}$を単位変換だけで代入しては
ならない。

### Reverse-flow lawの分離とbidirectional residual-gap仮定

独立parameterを

- $A_{fwd,max}$：favorable directionの最大EOA
- $A_{rev,closed}$：adverse directionの閉鎖時EROA

とする。active areaは

$$
A_{fwd}(\xi)
=A_{rev,closed}
+\xi\left(A_{fwd,max}-A_{rev,closed}\right),
$$

$$
A_{rev}(\xi)=A_{rev,closed},
$$

$$
A_{active}=
\begin{cases}
A_{fwd}(\xi),&\Delta P>0,\\
A_{rev,closed},&\Delta P<0.
\end{cases}
$$

とする。逆流時の面積を$\xi$から分離することで、「狭窄」と「閉鎖不全」を同じopening stateだけで表す
identifiability問題を避ける。同一弁のmixed diseaseは$A_{fwd,max}$と$A_{rev,closed}$という二つの入力を
競合なく合成できる。

ただし、これは両parameterの全方向のflow responseが独立という意味ではない。現行式はcoaptation gapを
双方向に残る最小hydraulic areaとみなし、reverse phaseのclinical EROAをそのseedに使う追加仮定を置く。
従って$A_{rev,closed}$を変えると、$\xi<1$のpartial forward openingにも影響する。ASEのEROAは逆流相の
vena-contracta areaで、周期内に動的となり得るため、これを時間不変のbidirectional gapと同一視するのは
V2の簡略化であり測定学的恒等式ではない。forward/reverse area-time dataが必要な症例では二つの独立した
area lawへmodel versionを上げる。

このV2ではadverse gradientへ転じた瞬間からreverse areaはclosed EROAになる。したがって、弁尖がまだ
開いている間のclosing regurgitationや弁尖衝突は再現しない。そこを必要とする用途ではV2のparameterを
曲げず、別versionでleaflet mechanicsまたはflow inertanceを比較する。

### `Cd`を一度だけ数えるorifice law

clinical EOAは、geometric area $A_g$へcontraction/discharge coefficientを掛けた

$$
A_{eff}=C_dA_g
$$

に相当する。したがってEOA/EROAをparameterとして保存するV2では$C_d$を別parameterにせず、
Bernoulli coefficientを

$$
B(A)=\frac{\rho}{2A^2}
$$

から単位変換する。native unitでは

$$
B(A)
=\frac{3.98\times10^{-4}}{A[\mathrm{cm^2}]^2}
\quad\left[\frac{\mathrm{mmHg\,s^2}}{\mathrm{mL^2}}\right].
$$

純粋な二次損失なら

$$
Q[\mathrm{mL/s}]
\simeq50.2\,A_{eff}[\mathrm{cm^2}]
\operatorname{sign}(\Delta P)\sqrt{|\Delta P[\mathrm{mmHg}]|}.
$$

V2は既存main-wire topology由来のlegacy series-loss priorとして、baseline由来の線形抵抗$R_{bg}$を
保持する。ただし$R_{bg}$は弁口EOAから導出した抵抗ではなく、EOAでscaleしない。

$$
R(A)=R_{bg}
$$

も保持し、

$$
\Delta P=R_{bg}Q+B(A)Q|Q|
$$

を満たす代数rootを使う。cancelationに強い形は

$$
Q
=\operatorname{sign}(\Delta P)
\frac{2|\Delta P|}
{R+\sqrt{R^2+4B|\Delta P|}}
$$

である。$A=0$では$Q=0$を厳密に返し、division回避のための面積floorを導入しない。

ここで$R_{bg}$は狭窄孔のPoiseuille抵抗でもMynard/CircAdaptから移植した文献parameterでもない。
clinical EOAを$B(A)$へ用いた上で
$R_{bg}$まで$(A_{ref}/A)^2$倍すると、同じarea依存を再度強く数え、特に低圧右心の小さいEROAで線形項が
Bernoulli項を圧倒する。したがってV2では、疾患による主要なarea依存をEOA/EROA由来の$B(A)$へ一元化し、
$R_{bg}$は全bracketでhealthy値に固定する。このpriorの寄与は$R_{bg}Q$と$B(A)Q|Q|$を別々にreportし、
$R_{bg}=0$ sensitivityで確認する。将来、粘性長さと幾何から独立に導出した抵抗を導入する場合は別version
とし、clinical EOAと二重計数しないことをbenchで確認する。

`dt=2 ms`で行った$R_{bg}=0$ closed-loop ablationは、healthyが6.244 s（6 complete beats後）でNewton
stagnation、AS-severeが0.956 sでNewton iteration limitとなり、周期解間の定量感度比較には到達しなかった。
純Bernoulli rootは$Delta P\to0$で$\partial Q/\partial\Delta P$が非有界となるため、現在のmonolithic
finite-difference Newtonでは線形series termがzero-gradient近傍のconditioningにも実質的に寄与する。
従ってV2では$R_{bg}$を保持するが、この結果を$R_{bg}$の生理的値のvalidationとは解釈しない。将来$R=0$
を正準候補にする場合は、semismooth formulation、flow unknown、または別の微分可能でenergy-consistentな
port実装を先に比較し、面積floorやleakへ問題を移さない。

開口時には

$$
\Delta P\,Q=R_{bg}Q^2+B|Q|^3\ge0
$$

なので、弁portは点ごとに受動的である。$A=0$の閉鎖反力は$Q=0$にしか作用せずhydraulic workをしない。
一方、$\xi$自体は弁尖energyから導いたwork-conjugate mechanicsではないため、弁尖応力や機械仕事を
readbackしてはならない。

### Bulk-flow stateを持たない境界

V2のaccepted stateに$Q$または$\dot Q$は入らない。各Newton candidateの圧差から$Q$を再構成する。
Ao--SAとPA--PArtのroot flow/inertanceはmain-wire circulationのownerであり、そのstateを弁側へ複製しない。

この構造で主張できないものは次である。

- 弁内血柱の有効長または弁尖運動量の同定
- adverse gradient中もforward flowが残るinertial closure
- water-hammer、click、leaflet impact、弁由来dicrotic notch
- 局所jet、渦、乱流、shear stress

MV/TV flowには正常でもE-waveとA-waveという二つの大きな峰があるため、「多峰性」をpeak数だけでfailに
しない。ただし、同じE-wave内の細かな反復峰、短時間の符号反転、opening stateのchatterは、圧差または
生理的event ownerを示せなければ不採用とする。

## Healthy kineticsを固定する理由と文献境界

公開Mynard系モデルには弁別のopening/closing rate例がある。

| source/model | TV | PV | MV | AoV | 単位と境界 |
|---|---:|---:|---:|---:|---|
| Rabineau et al. 2021, Mynard/Smolich由来 $K_{vo}$ | 40.0 | 26.7 | 26.7 | 26.7 | $\mathrm{mmHg^{-1}s^{-1}}$相当のsimulation seed |
| Rabineau et al. 2021, $K_{vc}$ | 53.3 | 26.7 | 53.3 | 26.7 | 同上 |
| Pant et al. 2022, $K_{vo}$ | 40.0 | 26.7 | 40.0 | 16.0 | 一症例のpatient-specific model |
| Pant et al. 2022, $K_{vc}$ | 53.3 | 26.7 | 53.3 | 16.0 | 一症例のpatient-specific model |

これらはヒト弁opening kineticsの直接計測populationではなく、異なるclosed-loop model内のparameterである。
またV2のtarget-plus-time-constant lawとは構造が違う。したがって、疾患面積と同時にkineticsまで動かすと
area、pressure drive、time constantの非同定性が増す。V1 bracketではkineticsをbaselineで凍結し、将来、
4D echoなどのarea--time dataが得られた場合だけ別model versionで更新する。

初期baselineは既存main-wire topologyを再現するためのmodel priorであり、正常ヒトpopulation fitではない。

| valve | $R_{legacy}$ (mmHg s/mL) | $A_{fwd,max}$ | $A_{rev,closed}$ | $k_{open}$ (/mmHg) | deadband (mmHg) | $w$ (mmHg) | $\tau_{open}$ / $\tau_{close}$ (s) |
|---|---:|---:|---:|---:|---:|---:|---:|
| MV | 0.0027 | 5.5 | 0 | 2 | 0.6 | 0.1 | 0.024 / 0.016 |
| AoV | 0.0015 | 3.5 | 0 | 3 | 0 | 0.1 | 0.006 / 0.008 |
| TV | 0.0035 | 8.0 | 0 | 2 | 0 | 0.1 | 0.018 / 0.010 |
| PV | 0.0050 | 4.0 | 0 | 2 | 0 | 0.1 | 0.010 / 0.006 |

疾患bracket間で上表のうち変更できるのは、狭窄なら$A_{fwd,max}$、逆流なら
$A_{rev,closed}$だけである。MVの0.6 mmHg deadbandも健康弁の臨床定数とは呼ばず、既存topology priorとして
固定する。

## Evidence tier

code metadataの`evidenceBasis`と文書の用語を次の三つに固定する。

| metadata | 意味 | 許される主張 |
|---|---|---|
| `guideline-area-anchor` | guidelineまたはecho recommendationにarea/EROAのanchorがある | area seedの順序と代表値を決める。ただし単一areaで臨床gradeを診断しない |
| `engineering-only-bracket` | 三段階の臨床area cut-offがない | ordered sensitivity inputに限る。`mild/moderate`は臨床grade名ではない |
| `hemodynamic-calibration-required` | 臨床severityが主にflow-derived outputで定義される | areaは初期seedだけ。periodic outputで較正しない限り採択しない |

これは`clinicalAreaThresholdStatus`とは別軸である。後者は「そのarea自体にどの種類の臨床thresholdがあるか」
を記録し、次の対応に固定する。

| 対象 | `clinicalAreaThresholdStatus` | 意味 |
|---|---|---|
| AS/AR/MS/MR/TRの全bracket | `guideline-area-anchor` | guideline/recommendationにareaまたはEROAのanchorがある |
| TS-severe | `guideline-significant-endpoint-anchor` | `severe`三段階cut-offではなく、significant TSのendpointだけにanchorがある |
| TS-mild / TS-moderate | `engineering-only-no-clinical-grade-anchor` | 臨床gradeに対応するarea thresholdなし |
| PS/PRの全bracket | `no-fixed-clinical-area-threshold` | Vmax/gradientまたはRFなどのflow-derived outputで評価する |

さらに、全24 bracketのcode metadataは`requiresClosedLoopHemodynamicValidation: true`である。これは、どの
area seedもclosed-loop periodic solutionで負荷依存の血行動態を確認しなければ採択できない、という共通gateを
意味する。AS/AR/MS/MR/TS/TRでは原則としてpost-solve **evaluation**であり、areaを書き換えることを必須と
しない。PS/PRだけは`requiresPostSolveAreaCalibration: true`とし、固定臨床area thresholdがないため、後述する
target outputへのarea-only **recalibration**までを必須とする。この二つを同じ意味の「calibration」として扱わない。

`guideline-area-anchor`にも測定法の違いがある。ASのcontinuity-equation AVAはeffective areaに近い一方、
MS/TSの2D planimetryは解剖学的areaである。後者をそのままhydraulic EOAと同一視せず、mean gradient、VTI、
heart rateを必ず併記する。

## 24 research brackets

次表の`area seed`はparameter inputであり、患者の診断値ではない。すべて単位は$\mathrm{cm^2}$である。
`mild/moderate/severe`は常に`research bracket`の接尾辞とともに表示する。

| bracket | target parameter | area seed | evidence | clinical/output anchorと境界 |
|---|---|---:|---|---|
| `AS-mild` | AoV $A_{fwd,max}$ | 1.75 | `guideline-area-anchor` | conventional AVA $>1.5$、Vmaxおよそ2.6--2.9 m/s、mean gradient $<20$ mmHgを参考に周期解を報告 |
| `AS-moderate` | AoV $A_{fwd,max}$ | 1.25 | `guideline-area-anchor` | AVA 1.0--1.5、Vmax 3--4 m/s、mean gradient 20--40 mmHgを統合評価 |
| `AS-severe` | AoV $A_{fwd,max}$ | 0.80 | `guideline-area-anchor` | AVA $<1.0$、Vmax $\ge4$ m/s、mean gradient $\ge40$ mmHgが整合するかを確認。low-flow discordanceを許容し明記 |
| `AR-mild` | AoV $A_{rev,closed}$ | 0.05 | `guideline-area-anchor` | EROA $<0.10$、RVol $<30$ mL、RF $<30\%$を参考にする |
| `AR-moderate` | AoV $A_{rev,closed}$ | 0.20 | `guideline-area-anchor` | 2017 ASEの二つの中間gradeを一つのresearch bracketへ圧縮。EROA 0.10--0.29、RVol 30--59 mL、RF 30--49%を報告 |
| `AR-severe` | AoV $A_{rev,closed}$ | 0.35 | `guideline-area-anchor` | EROA $\ge0.30$、RVol $\ge60$ mL、RF $\ge50\%$に加えholodiastolic aortic reversalを確認 |
| `MS-mild` | MV $A_{fwd,max}$ | 1.75 | `guideline-area-anchor` | historical area $>1.5$のordered seed。planimetric MVAとhydraulic EOAは同一ではない |
| `MS-moderate` | MV $A_{fwd,max}$ | 1.25 | `guideline-area-anchor` | area 1.0--1.5のseed。現在のmanagement guidelineでは$\le1.5$がclinically significantとなり得るため名称を診断に使わない |
| `MS-severe` | MV $A_{fwd,max}$ | 0.80 | `guideline-area-anchor` | area $<1.0$のseed。mean gradient、HR、LA pressure、PAPを併記する |
| `MR-mild` | MV $A_{rev,closed}$ | 0.10 | `guideline-area-anchor` | primary MRのEROA $<0.20$、RVol $<30$ mL、RF $<30\%$を参考にする |
| `MR-moderate` | MV $A_{rev,closed}$ | 0.25 | `guideline-area-anchor` | primary MR EROA 0.20--0.39、RVol 30--59 mL、RF 30--49%を統合評価 |
| `MR-severe` | MV $A_{rev,closed}$ | 0.45 | `guideline-area-anchor` | primary MR EROA $\ge0.40$、RVol $\ge60$ mL、RF $\ge50\%$を参考にする |
| `TS-mild` | TV $A_{fwd,max}$ | 2.00 | `engineering-only-bracket` | 三段階の臨床area anchorなし。順序付きsensitivity inputのみ |
| `TS-moderate` | TV $A_{fwd,max}$ | 1.40 | `engineering-only-bracket` | 三段階の臨床area anchorなし。`moderate TS`という診断を主張しない |
| `TS-severe` | TV $A_{fwd,max}$ | 0.90 | `guideline-area-anchor` | significant TSのarea $\le1.0$、mean gradientおよそ$\ge5$ mmHg、PHT $\ge190$ ms、diastolic VTIおよそ$\ge60$ cmを確認 |
| `TR-mild` | TV $A_{rev,closed}$ | 0.10 | `guideline-area-anchor` | EROA $<0.20$、RVol $<30$ mLを参考にする |
| `TR-moderate` | TV $A_{rev,closed}$ | 0.30 | `guideline-area-anchor` | EROA 0.20--0.39、RVol 30--44 mLを参考にする |
| `TR-severe` | TV $A_{rev,closed}$ | 0.50 | `guideline-area-anchor` | EROA $\ge0.40$、RVol $\ge45$ mL、hepatic-vein systolic reversalを確認。massive/torrentialの拡張gradeはV1外 |
| `PS-mild` | PV $A_{fwd,max}$ | 1.40 | `hemodynamic-calibration-required` | 周期解後Vmax $<3$ m/s、peak Doppler gradient $<36$ mmHgへarea-only較正 |
| `PS-moderate` | PV $A_{fwd,max}$ | 0.70 | `hemodynamic-calibration-required` | Vmax 3--4 m/s、peak Doppler gradient 36--64 mmHgへarea-only較正 |
| `PS-severe` | PV $A_{fwd,max}$ | 0.45 | `hemodynamic-calibration-required` | Vmax $>4$ m/s、peak Doppler gradient $>64$ mmHgへarea-only較正 |
| `PR-mild` | PV $A_{rev,closed}$ | 0.10 | `hemodynamic-calibration-required` | 周期解後RF $<20\%$、代表target 10%へarea-only較正 |
| `PR-moderate` | PV $A_{rev,closed}$ | 0.40 | `hemodynamic-calibration-required` | RF 20--40%、代表target 30%へarea-only較正 |
| `PR-severe` | PV $A_{rev,closed}$ | 0.90 | `hemodynamic-calibration-required` | RF $>40\%$、代表target 45%。PHT $<100$ ms、jet width/annulus $\ge0.7$、PA branch reversal、RV dilationはsupporting output |

PS/PRについては、現行のnormal-adult reference operating pointで一回だけarea-onlyの初期較正を行った。
PSの初回seed 2.0/1.3/0.8 cm²はVmax 2.09/2.63/3.31 m/sとなり、output帯を分離できなかったため、
実測した概ね$V_{max}\propto A^{-0.5}$の関係から1.4/0.7/0.45 cm²へ更新した。再計算値は
2.52/3.47/3.95 m/s（peak simplified-Doppler gradient 25.5/48.3/62.4 mmHg）であり、severeは4 m/s
境界直下のborderlineである。PRの初回0.1/0.3/0.5 cm²はRF 10.8/24.6/33.0%であったため、
0.1/0.4/0.9 cm²へ更新し、10.8/29.3/43.5%を得た。

これは現行の未最終校正vascular systemに依存する暫定reference seedで、clinical gradeのfitではない。
血管系、preload/afterload owner、心室operating pointの校正後にPS/PRを再検証し、今回は境界値へ追い込む
追加iterationを行わない。したがってcode metadataの`requiresPostSolveAreaCalibration`は維持する。

AR/MR/TRのEROA thresholdも単独診断ではない。timing、jet geometry、chamber response、RVol、RFを含む
integrated assessmentが必要である。特にfixed EROAのMR bracketは、secondary MRのcrescent orifice、
biphasic/dynamic MR、late-systolic prolapse、annular dilation、papillary tetheringを表さない。secondary MRは
別のmechanistic phenotypeであり、固定EROAを動的geometryの代用品にしない。2025 ESC/EACTSはsecondary
MRについてEROA $\ge0.30\ \mathrm{cm^2}$ and/or RVol $\ge45\ \mathrm{mL}$をoutcome-relevantな目安として
挙げるが、これは治療最適化後、euvolemicかつnormotensiveな条件でのdynamic lesion評価である。したがって、
この値を上表のprimary-MR向け固定EROA bracketへ置換しない。

## PSとPRのpost-solve較正

### Pulmonary stenosis

PSは臨床的にvalve areaよりVmaxとpeak gradientでgradeされる。area seedからcanonical periodic solveを行い、

$$
V_{max}=\max_t\frac{Q_{PV}^{+}(t)}{100A_{active}(t)}
\quad[\mathrm{m/s}],
$$

$$
\Delta P_{Doppler,pk}=4V_{max}^2
\quad[\mathrm{mmHg}]
$$

を得る。初期seedの概算だけなら、reference peak flow $Q_{pk,ref}$とtarget velocityから

$$
A_{seed}^{(0)}
=\frac{Q_{pk,ref}[\mathrm{mL/s}]}
{100V_{target}[\mathrm{m/s}]}
$$

を使える。採択時のarea調整は$A_{fwd,max}$一個だけを変えるscalar solveとし、RV contractility、PVR、
root resistance、kineticsでgradeへfitしない。調整後は新しいparameter identityを発行し、元のseedを
書き換えたことを隠さない。

modeled node-to-node $P_{RV}-P_{PA}$、Doppler instantaneous peak gradient、catheter peak-to-peak gradientは
別量として保存する。後二者を同一視しない。

### Pulmonary regurgitation

PRは固定EROA cut-offの臨床根拠が弱いため、周期解から

$$
V_{fwd}=\int_{Q>0}Q\,dt,
\qquad
V_{reg}=-\int_{Q<0}Q\,dt,
$$

$$
RF=100\frac{V_{reg}}{V_{fwd}}
$$

を計算し、RF bracketへ$A_{rev,closed}$だけをscalar較正する。二次損失だけを仮定した初期推定は

$$
A_{rev}^{(0)}
\simeq
\frac{V_{reg,target}}
{50.2\int_{\Delta P<0}\sqrt{|\Delta P(t)|}\,dt}
$$

であるが、実際のV2には線形抵抗とclosed-loop feedbackがあるため、この式を最終解としない。
PHT、diastolic PA branch reversal、RV volumeはsupporting metricsであり、areaを直接逆算する式ではない。

ここでRF $<20\%$、20--40%、$>40\%$と代表target 10/30/45%は、主にCMR由来の弱いresearch bracketで
あり、ASE 2017自身もcut-offが十分にvalidatedされていないとする。したがって、順序付き感度解析と
area-only較正のtargetには使えるが、単独のclinical grade acceptanceには使わない。PRの採択にはRFに加え、
PHT、jet width、PA branch flow reversal、RV size/functionを統合して報告する。

## Isolated acute lesionとchronic phenotypeの境界

各単独bracketが変更するのは一つの弁の一方向areaだけである。自動的に変更しないものは次である。

- ventricular/atrial wall mass、reference geometry、passive stiffness、Land contractility
- LA/RA/LV/RV dilation、fibrosis、RV hypertrophy
- systemic/pulmonary vascular resistance、compliance、venous tone
- pericardial capacityまたはeffusion
- rhythm、AV delay、AF
- annular dilation、leaflet prolapse、calcification、commissural fusion、chordal rupture、papillary tethering

したがって`AS-severe`は「慢性重症AS患者」ではなく、現在のbaseline循環へ急に小さいAoV forward EOAを
置いたisolated hemodynamic lesionである。慢性症例は将来、弁bracketと独立したremodeling bundleを
compositionし、各parameterのevidenceを別々に記録する。疾患名によるhidden branchで全身parameterを一括
変更しない。

同じ弁のstenosisとregurgitationは方向別areaとして合成できるが、二つの同方向severity bracketは競合として
拒否する。mixed diseaseの臨床severityは個別gradeの単純和ではなく、合成後の周期hemodynamicsで評価する。

## Pressure recovery limitation

V2のBernoulli lossはvena-contractaで得るDoppler EOAを、upstream nodeからdownstream nodeまで完全に
不可逆な損失として扱う。実際にはsemilunar stenosisの下流で運動energyの一部がstatic pressureへ戻る。
したがって、小さいascending aortaなどpressure recoveryが大きい条件では、V2がLV afterloadを過大評価する
可能性がある。

Garciaらのenergy-loss coefficientは、Doppler EOAとascending-aortic area $A_a$から

$$
ELCo=\frac{EOA\,A_a}{A_a-EOA}
$$

としてnet energy lossへ近づける指標である。ただしV2では未実装とし、EOAを無断でELCoへ置換しない。
Ao/PA root nodeの圧がvena-contracta、直後root、十分下流のどれを意味するかをreportで固定する。
将来pressure recoveryを入れる場合は、下流面積を持つenergy-consistent portとしてmodel versionを上げ、
AS/PS bracketを再較正する。

## Verification and acceptance metrics

### Stage 0: isolated valve bench hard gates

全normal parameterと24 bracketについて次を要求する。

1. $0\le\xi\le1$、有限値、同一inputに対する決定論性。
2. $A_{fwd,max}>0$、$A_{rev,closed}\ge0$、$A_{rev,closed}\le A_{fwd,max}$。
3. $A=0$で$Q=0$が厳密で、numerical area floorがない。
4. 開口時のalgebraic residualとhydraulic power balanceがmachine-precision近傍で閉じる。
5. すべての開口flowで$\Delta P Q\ge0$。
6. $|\Delta P|$固定でareaを小さくすると$|Q|$が単調減少し、$|Q|$固定でareaを小さくすると必要
   $|\Delta P|$が単調増加する。
7. 疾患bracketのkinetics fields、非対象弁、反対方向areaがnormal baselineとbit-exactに一致する。
8. 同じ弁のstenosis/regurgitation compositionが入力順に依存せず、parameter identityが安定する。

### Stage 1: closed-loop numerical hard gates

既存のnormal-adult five-wall periodic protocolと同じTBV owner、circulation graph、mechanics provider、Ca prior、
pericardiumを用い、弁research input以外を変更しない。

- period-1 fixed-scale closure $\le10^{-3}$を3拍連続で満たしたterminal cycleだけ解釈する。
- period-2または最大拍数到達をperiod-1の代用にしない。
- continuity residual、TBV error、mechanics assembly residualを既存normal protocolと同じ単位・gateで保存する。
- circulation Newtonのaccepted-step gateは各nodeで
  $|r_i|\le10^{-8}\ \mathrm{mL}+2\times10^{-10}\max(10\ \mathrm{mL},|V_i^n|)$とする。
  相対項だけの閾値跨ぎで正常解を棄却しないためのmixed toleranceであり、弁flowの平滑化、physical leak、
  または生理parameterではない。有限差分幅は従来の$2\times10^{-6}$を維持し、coarse two-beat回帰では
  maximum continuity residual $<10^{-7}$ mLを別のhard auditとする。
- $\xi$、$Q$、各node volume/pressureにNaN、Inf、負のblood volumeがない。
- valve flow、opening target、$\xi$、$\Delta P$をaccepted timeで同時保存し、時間補間やsmoothingでpeakを消さない。
- `dt=2 ms`と`dt=1 ms`を同じaccepted checkpointから独立に分岐し、相互warm-startを使わない。
- dt-halvingではSV、CO、mean pressure、peak/mean gradient、Vmax、Vfwd、Vreg、RF、valve-event timing、
  waveform fixed-scale differenceを報告する。収束次数は二点比較だけから主張しない。

### Stage 2: flow morphology hard gates

単なるpeak countではなく、event ownerを監査する。

- MV/TV forward flowはsinus rhythmでE-wave、diastasis、A-waveのevent順序を保つ。EまたはAの内部に現れる
  追加の明瞭な極大は、対応する$\Delta P$、PV/venous inflow、atrial activationの極値を示せなければfailとする。
- AoV/PV forward flowは一つの連続したsystolic ejection intervalを持つ。反射波によるshoulderは許容するが、
  root pressure/flowに同じownerが必要である。
- 一つの生理phase内での短時間のopening/closing反復、交互のflow符号、zero-area support反力のchatterを許容しない。
- MR/TRの主要reverse intervalはsystole、AR/PRはdiastoleに存在する。phase外逆流はvolumeとownerを別報告し、
  kineticsを局所調整して隠さない。
- regurgitant flowがあるとき、対象弁の$V_{reg}$と上流・下流continuity ledgerが一致する。

metricsの`longest-cyclic-forward-flow-threshold-inactive-run`は、sampled flowから期待逆流相を近似する
waveform proxyであり、独立した生理学的event gateではない。このrunだけでsystole/diastoleを同定せず、Stage 2の
phase判定ではpressure、flow、chamber eventとownerを併せて監査する。

MV/TVのE/A二峰を「多峰性」として削除してはならない。反対に、flow inertanceを外しただけで全波形が
生理的になったとも主張しない。

### Stage 3: lesion-specific outputs

| lesion | 必須readback |
|---|---|
| AS | input EOA、Vmax、Doppler peak/mean gradient、modeled LV--Ao gradient、velocity ratio、SVI、LV pressure/volume |
| AR | input EROA、Vfwd、Vreg、RVol、RF、aortic diastolic reversal、Ao diastolic/pulse pressure、LV volume |
| MS | input EOA、mean/peak transmitral gradient、HR、VTI、LA pressure、PAP、MV flow E/A |
| MR | input EROA、RVol、RF、total LV SVとforward Ao SV、LA v-wave、pulmonary venous systolic flow、逆流timing |
| TS | input EOA、mean gradient、VTI、PHT、RA pressure、systemic venous congestion readback |
| TR | input EROA、RVol、RF、RA v-wave、hepatic-vein systolic reversal、RV/RA volume、forward PA SV。TR jet velocity単独をseverityに使わない |
| PS | input/較正後EOA、Vmax、Doppler peak gradient、modeled RV--PA gradient、RV systolic pressure、forward SV |
| PR | input/較正後EROA、RVol、RF、PA diastolic reversal、PHT、RV EDV/ESV/SV |

reference operating pointでは、各bracketが対応するclinical/output anchorと整合するかを判定する。areaだけ
合ってoutputが外れる場合、臨床grade成立とはしない。closed-loopでは重症化に伴いflow自体が低下し得るため、
全てのpeak gradientが必ず単調増加するというhard gateは置かず、flow、area、gradientの三者を併記する。

### Stage 4: robustness envelope

referenceで採択した後、少なくともHR 50/70/100 bpm、preload owner $\pm20\%$、systemic/pulmonary afterload
owner $\pm20\%$、対象側contractility $\pm20\%$のone-factor-at-a-time envelopeを実行する。これは各負荷で
同じ臨床gradeを強制する試験ではない。次をhard gateとする。

- solver、periodicity、mass conservation、state bounds、受動性を維持する。
- phase-inappropriate flow、chatter、未説明の追加峰を新規に作らない。
- stenosisでは固定flow benchのarea--gradient ordering、regurgitationでは固定gradient benchの
  area--reverse-flow orderingを維持する。
- outputがload dependentにgrade境界を跨いだ場合はそのまま報告し、他parameterで形状fitしない。

## 明示的な非目標

- ModelCoreまたはweb product runtimeへの採用を、この文書またはsidecar testだけから主張しない。
- 24 bracketをmedical device、診断、治療選択、patient-specific予測に使わない。
- fixed EOA/EROAでdynamic secondary MR/TR、prolapse、flail、calcification morphologyを表したと呼ばない。
- Doppler EOA、anatomic planimetry area、Gorlin area、ELCoを同一量として混用しない。
- Doppler instantaneous peak、mean gradient、catheter peak-to-peak gradientを混用しない。
- EROAへ`Cd`を二重適用しない。
- solver用regularizationをphysical leakとしてreportしない。
- lesion gradeへ合わせるためにkinetics、chamber mechanics、vascular loadを同時fitしない。

## 一次資料と直接link

以下は式、parameter seed、臨床anchor、claim boundaryを確認するためのsourceである。短いparaphraseだけを
本仕様へ取り込み、表の完全な転載や、source modelが本実装をvalidationしたという主張はしない。

### Computational valve models

1. Arts T, et al. *Adaptation to mechanical load determines shape and properties of heart and circulation: the CircAdapt model*.
   [DOI 10.1152/ajpheart.00444.2004](https://doi.org/10.1152/ajpheart.00444.2004).
   CircAdaptの循環・弁flow stateを含む原著で、acute interventionとadaptationの区別にも用いる。
2. CircAdapt Framework, *Valve module*.
   [current public documentation](https://framework.circadapt.org/latest/userguide/components/connector/valve.html) and
   [verification benchmark](https://framework.circadapt.org/latest/userguide/verification/Valve.html).
   現行公開実装はdirection-dependent area、leak area、flow ODEを持つ。V2が同じ式を実装したという意味ではない。
3. Mynard JP, et al. *A simple, versatile valve model for use in lumped parameter and one-dimensional cardiovascular models*.
   [DOI 10.1002/cnm.1466](https://doi.org/10.1002/cnm.1466).
4. Rabineau J, et al. *Closed-Loop Multiscale Computational Model of Human Blood Circulation*.
   [PMC8697684](https://pmc.ncbi.nlm.nih.gov/articles/PMC8697684/) and
   [DOI 10.3389/fphys.2021.734311](https://doi.org/10.3389/fphys.2021.734311).
   Table 1にMynard/Smolich由来の四弁rate seedが公開されている。**PMC8697684の著者はPiccioliではなく
   Rabineauら**であるため、書誌を誤記しない。
5. Pant S, et al. *Multiscale modelling of Potts shunt as a potential palliative treatment for suprasystemic idiopathic pulmonary artery hypertension*.
   [PMC8940869](https://pmc.ncbi.nlm.nih.gov/articles/PMC8940869/) and
   [DOI 10.1007/s10237-021-01545-2](https://doi.org/10.1007/s10237-021-01545-2).
   一症例modelの弁rate/area tableであり、population normal値ではない。

### Echo and clinical anchors

6. Zoghbi WA, et al. *Recommendations for Noninvasive Evaluation of Native Valvular Regurgitation* (ASE/SCMR, 2017).
   [ASE PDF](https://www.asecho.org/wp-content/uploads/2025/04/2017VavularRegurgitationGuideline.pdf) and
   [DOI 10.1016/j.echo.2017.01.007](https://doi.org/10.1016/j.echo.2017.01.007).
   AR/MR/TRのEROA、RVol、RFとPR supporting signsのprimary anchorである。
7. Baumgartner H, et al. *Recommendations on the Echocardiographic Assessment of Aortic Valve Stenosis: A Focused Update* (EACVI/ASE, 2017).
   [ASE PDF](https://www.asecho.org/wp-content/uploads/2025/04/2017ValveStenosisGuideline.pdf) and
   [DOI 10.1016/j.echo.2017.02.009](https://doi.org/10.1016/j.echo.2017.02.009).
8. Baumgartner H, et al. *Echocardiographic Assessment of Valve Stenosis* (EAE/ASE, 2009).
   [ASE PDF](https://www.asecho.org/wp-content/uploads/2025/04/2009_Echo-Assessment-of-Valve-Stenosis_note_added.pdf) and
   [DOI 10.1016/j.echo.2008.11.029](https://doi.org/10.1016/j.echo.2008.11.029).
   AS/MS/TS/PSのmeasurement boundaryに用いる。文書自身が後続guidelineによるMS更新を注記しているため、
   2009のMS cut-offを現行診断ruleとして固定しない。
9. Otto CM, et al. *2020 ACC/AHA Guideline for the Management of Patients With Valvular Heart Disease*.
   [DOI 10.1016/j.jacc.2020.11.018](https://doi.org/10.1016/j.jacc.2020.11.018).
10. Praz F, et al. *2025 ESC/EACTS Guidelines for the management of valvular heart disease*.
    [European Heart Journal](https://academic.oup.com/eurheartj/article/46/44/4635/8234488) and
    [DOI 10.1093/eurheartj/ehaf194](https://doi.org/10.1093/eurheartj/ehaf194).
    current management contextとmultiparametric assessmentの確認用であり、24 bracketを診断algorithmへ変換しない。

### Pressure recovery

11. Garcia D, et al. *Discrepancies between catheter and Doppler estimates of valve effective orifice area can be predicted from the pressure recovery phenomenon*.
    [DOI 10.1016/S0735-1097(02)02764-X](https://doi.org/10.1016/S0735-1097%2802%2902764-X).
    Doppler EOAとnet energy lossを区別するpressure-recovery limitationのprimary sourceである。
