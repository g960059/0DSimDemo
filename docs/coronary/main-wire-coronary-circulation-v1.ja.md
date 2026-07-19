# Main-wire 冠循環 V1 数理モデル仕様

## 0. 文書の状態と結論

この文書は、four-chamber full Land–membrane TriSeg、common pericardium、fixed-TBV closed loop を持つ
main-wire scientific runtime に、冠循環を**同じ保存系の一部として**追加する V1 の実装仕様である。
目的は一つの冠血流波形を形状 fitting することではない。正常、冠動脈狭窄、冠微小循環障害、低血圧、
頻脈、高 LVEDP、左室肥大・大動脈弁狭窄、右室圧負荷などを、同じ因果構造の parameter 変更で
表現できる最小モデルを作ることである。

### 0.1 2026-07-19 branch implementation status

この文書は完成済みruntimeの説明書ではなく、**採択数理仕様 + 段階的acceptance contract**である。現在branchで
確認できる実装境界は次である。

- **Phase A kernel implemented / targeted green**：3 territory × 2 layer topology、10 conserved coronary volume、
  linear epicardial / CS compliance、intramyocardial collapsible PV、$R(V)$、Young–Tsai reduced loss、
  3 accepted tone state、pure Backward Euler trial / commit / rollback / checkpoint、post-lesion algebraic $P_d$、
  distributed-arterial tone ownership、$r_{min}=4/45$、collapse-only $R(V)$をtargeted testで確認した。
- **Phase B atomic transaction implemented / periodic adoption pending**：same-candidate five-wall Land / TriSeg
  readbackからLV/RV transmural pressure、Land active stress、common external pressureを作るtyped bridgeと、
  noncoronary outer solverのgeneric conservative-companion seam、Ao uptake / RA returnを接続するcoronary adapter、
  circulation / coronary / mechanicsのatomic commit / rollbackはbranchのtargeted testで確認した。ただしこれは
  one-step transaction acceptanceであり、full 25-node healthy periodic releaseやbrowser runtime adoptionを意味しない。
- **Phase C--E not yet canonical**：healthy periodic calibration、CFR / FFR-like protocol、disease envelope、
  observable / controller registry、Workbench / browser runtime adoptionは将来workである。以下のUI節はproduct
  contractであり、現在のbrowser表示を記述したものではない。

したがってpure kernel testがgreenでも、closed-loop waveform、CFR、FFR-like、browser behaviorが検証済みとは
解釈しない。各phaseのclaimはそのphaseのartifactとtest gateを通過した時点でのみ昇格する。

V1 の採択構造は次である。

1. LAD、LCx、RCA の3本の epicardial branch を分ける。
2. 各 territory を subepicardial（EPI）と subendocardial（ENDO）の2層へ分ける。
3. 各 branch に terminal epicardial arterial compliance、各層に collapsible intramyocardial compliance、
   全 territory に共通の coronary sinus compliance を置く。
4. intramyocardial pressure（IMP）は cavity-induced extracellular pressure（CEP）と、
   同じ candidate で評価した Land active fiber stress の和から作る。
5. microvascular resistance のvolume依存はcollapse側だけに限定する。loaded reference以上のdistensionでは
   $R=R_0$へ飽和させ、Poiseuille-inspired collapse gainとslow-tone vasodilationを二重計上しない。
6. autoregulation は territory ごとに1個の遅い log-resistance state を持つ。分子経路を列挙する代わりに、
   mean flow error、mean perfusion pressure、demand target を一つの bounded tone actuator へ集約する。
7. focal epicardial stenosis は Young–Tsai 型の linear + quadratic pressure loss で表す。病変直後・健康な
   distributed arterial resistance直前にmassless $P_d$ sampleを置き、FFR-likeのdistal pressureとする。
8. coronary node volume はすべて TBV ledger に含める。定流量 source、拍ごとの volume projection、
   冠循環だけの隠れ reservoir は置かない。
9. FFR-like 値は maximal-hyperemia protocol が成立したときだけ出す。resting $P_d/P_a$ を FFR と呼ばない。
10. V1 は0D coronary mechanics model であり、1D wave propagation、CFD、collateral、oxygen transport、
    regional infarct feedback は主張しない。

この構造は、古典的 intramyocardial pump / waterfall model、CEP と contraction-related pressure の
併用、冠微小血管の transmural heterogeneity を残しつつ、3D morphometry tree や多段 biochemical control を
13個の生理 state（10 volume + 3 tone）へ縮約する。

## 1. 文献から採る事実と、V1 で行う縮約

以下を混同しない。

| 項目 | 文献・実験が支持する内容 | V1 の縮約・仮定 |
|---|---|---|
| myocardial–vessel interaction | cavity pressure だけ、または contraction-related pressure だけでは主要な phasic flow feature を同時に説明しにくい。CEP と contraction-related component の併用が有力である | CEP と Land active stress の線形和を使う。細胞内圧、間質圧、poromechanics を別 state にしない |
| transmural IMP | CEP は endocardium 側で cavity pressure に近く、epicardium 側へ低下する | 3層ではなく EPI/ENDO の2層 centroid $d=0.25,0.75$ を使う |
| vascular compliance / waterfall | intramyocardial compliance と外圧変化は arterial inflow と venous outflow の位相差、zero-flow pressure、systolic impediment に重要 | 各層1個の collapsible compliance と前後の volume-dependent resistance で表す。V1 は独立した downstream pressure clamp を重ねない |
| vessel caliber | 収縮中に intramural arteriole / venule diameter が変化し、その程度は transmural depth で異なる | cross-sectional area を直接 state にせず、固定長を仮定して blood volume を area surrogate とする |
| left–right difference | 左冠血流は強い diastolic predominance、RCA はより均等な systolic/diastolic flow を示す | LAD/LCx は LV/SEP、RCA は RV/SEP の cavity pressure と active stress に結合する |
| autoregulation | myogenic、metabolic、flow-dependent mechanisms が相互作用し、低い perfusion pressure では dilation reserve が尽きる | territory ごとに1個の bounded tone stateへ集約する。個別 mediator concentration は持たない |
| stenosis loss | stenosis pressure loss は低流量の viscous linear term と、高流量で強い separation-related quadratic termを持つ | Young–Tsai の unsteady inertial termを除き、$RQ+BQ|Q|$ を使う |
| CFR / FFR | CFR は rest に対する hyperemic flow ratioで、epicardial と microvascular の両方を反映する。FFR は maximal hyperemia 下の lesion-specific pressure-derived indexである | CFR と FFR-like を別 protocol とし、通常の resting simulation metric と混ぜない |

根拠となる primary study / model は、CEP と active stress coupling を closed-loop へ入れた
[Munneke et al. 2022](https://doi.org/10.3389/fphys.2022.830925)、複数の myocardial–vessel interaction
mechanism を比較した [Algranati et al. 2010](https://doi.org/10.1152/ajpheart.00925.2009)、
wall stress と冠血流を少数 parameter で結んだ
[Bovendeerd et al. 2006](https://doi.org/10.1007/s10439-006-9189-2)、waterfall model の resistance と
compliance を同定した [Burattini et al. 1985](https://doi.org/10.1007/BF02407768)、および beating heart の
微小血管径を直接観察した [Hiramatsu et al. 1998](https://pmc.ncbi.nlm.nih.gov/articles/PMC2230961/) である。

V1 の式はこれらの論文式をそのまま複製したものではない。特に、2層化、単一 tone actuator、
volume-based tube law、Land active stress との接続は本プロジェクト固有の reduced-order construction である。

## 2. 所有境界

### 2.1 coronary kernel が所有するもの

- coronary node の PV law と volume state
- coronary edge の signed flow law
- focal lesion直後のmassless $P_d$ sampleとdistributed arterial series loss
- volume-dependent resistance
- territory tone state とその relaxation
- Young–Tsai 型 stenosis loss
- coronary graph の incidence balance と局所 Jacobian
- kernel parameter validation、checkpoint serialization、pure trial readback

### 2.2 whole-heart transaction が所有するもの

- Ao と RA の candidate absolute pressure / volume
- LV、RV、septum の Land active stress と transmural cavity pressure
- common intrathoracic pressure と common pericardial pressure
- territory-to-wall mapping
- coronary と noncoronary を合わせた fixed TBV
- mechanics、noncoronary、coronary の atomic commit / rollback
- accepted beat から作る mean flow、mean perfusion pressure、demand target

### 2.3 protocol / observable owner が所有するもの

- rest、hyperemia、recovery の実験手順
- CFR、FFR-like、resting $P_d/P_a$ の適用可能性判定
- systole / diastole event segmentation
- territory / layer average、diastolic fraction、ENDO/EPI ratio
- 単位、label、provenance、QC reason の UI 表示

### 2.4 所有してはならないもの

- coronary flow を正常値へ強制する prescribed source
- Ao runoff を引いた後に systemic reservoir へ同量を戻す補正
- negative volume を隠す post-step clamp
- resting $P_d/P_a$ を `FFR` と表示する shortcut
- hyperemia driveをaccepted tone targetとhydraulic resistanceへ二重適用すること
- healthy distributed arterial lossをfocal lesion lossへ混ぜ、terminal $P_A$をFFR-likeの$P_d$として使うこと
- active stress と chamber pressure を別時相・別 candidate から読むこと
- common pericardial / intrathoracic pressure を IMP に二重加算すること

## 3. topology と state

territory を

$$
k\in\mathcal K=\{LAD,LCx,RCA\},
$$

layer を

$$
\ell\in\mathcal L=\{EPI,ENDO\}
$$

とする。冠循環外の境界 node は Ao と RA である。

### 3.1 volume state: 10個

- terminal epicardial / prearteriolar storage volume $V_{A,k}$：3個
- intramyocardial layer volume $V_{M,k,\ell}$：6個
- common coronary sinus volume $V_{CS}$：1個

### 3.2 tone state: 3個

- territory microvascular resistance scale $r_k>0$：3個

accepted stateは正の resistance scale $r_k$ 自体を保存する。$y_k=\ln r_k$ はtarget計算とexact relaxationに
使うalgorithmic coordinateで、別stateではない。`tone01` も表示用の derived observableである。

### 3.3 algebraic flow: 16本

- $Q_{Ao,k}$：Ao $\rightarrow$ epicardial artery、3本
- $Q_{A,k,\ell}$：epicardial artery $\rightarrow$ layer bed、6本
- $Q_{V,k,\ell}$：layer bed $\rightarrow$ CS、6本
- $Q_{CS}$：CS $\rightarrow$ RA、1本

さらに各territoryにmassless algebraic post-lesion pressure $P_{d,k}$ を3個持つ。これはvolume stateではない。
$P_{d,k}$ はfocal lesionの直後、healthy distributed arterial resistanceとterminal storage $A_k$ の直前に置く。

解剖学的な cardiac valve ではないため、すべて signed flow とする。生理的 baseline で一時的な逆流が
生じ得る edge を diode にしてはならない。

```text
Ao → lesion(LAD) → Pd(LAD) → Rdist(LAD,r^alpha) → Aterm(LAD) ─┬→ M(LAD,EPI) ─┐
                                                               └→ M(LAD,ENDO) ┤
Ao → lesion(LCx) → Pd(LCx) → Rdist(LCx,r^alpha) → Aterm(LCx) ─┬→ M(LCx,EPI) ─┤
                                                               └→ M(LCx,ENDO) ├→ CS → RA
Ao → lesion(RCA) → Pd(RCA) → Rdist(RCA,r^alpha) → Aterm(RCA) ─┬→ M(RCA,EPI) ─┤
                                                               └→ M(RCA,ENDO) ┘
```

LAD と LCx を一つの left-coronary resistance にまとめない理由は、focal lesion、territory-specific CFR、
dominance、将来の multipatch / scar を表現できなくなるためである。一方、V1 で別の capillary、venule、
territory vein を追加しない理由は、平均流と主要な phasic compression を同定するデータに対して state と
parameter の増加が先行するためである。

## 4. 単位・符号・pressure reference

実装境界では次を固定する。

| 量 | 単位 |
|---|---|
| time | s |
| volume | mL |
| flow | mL/s |
| pressure | mmHg |
| Land stress | Pa |
| linear resistance | mmHg s/mL |
| quadratic loss | mmHg s$^2$/mL$^2$ |
| compliance inverse tangent | mmHg/mL |

$Q_{u\rightarrow d}>0$ は upstream から downstream への流れである。抵抗性 edge は必ず

$$
\Delta P(Q)Q\ge0
$$

を満たす。

pressure は absolute と transmural を型・field 名で区別する。冠血管の absolute pressure は

$$
P^{abs}=P_{ext}^{abs}+P^{tm}
$$

で作る。common intrathoracic pressure と common pericardial pressure は $P_{ext}^{abs}$ の owner が
一度だけ加える。CEP へ渡す chamber pressure は、それらを除いた cavity transmural pressure である。

## 5. volume balance と fixed-TBV

各 state の保存式は

$$
\dot V_{A,k}
=Q_{Ao,k}-\sum_{\ell\in\mathcal L}Q_{A,k,\ell},
$$

$$
\dot V_{M,k,\ell}
=Q_{A,k,\ell}-Q_{V,k,\ell},
$$

$$
\dot V_{CS}
=\sum_{k\in\mathcal K}\sum_{\ell\in\mathcal L}Q_{V,k,\ell}-Q_{CS}
$$

である。同じ $Q_{Ao,k}$ を Ao node incidence から引き、同じ $Q_{CS}$ を RA node incidenceへ加える。
したがって

$$
V_{cor}
=\sum_kV_{A,k}+\sum_{k,\ell}V_{M,k,\ell}+V_{CS},
$$

$$
\frac{d}{dt}\left(V_{noncor}+V_{cor}\right)=0
$$

が graph incidence から成立する。数値実装は systemic venous node `SV` を従属 volume とする既存方式を
継続し、noncoronary 15 node と coronary 10 node の計25 physical volume のうち24個を outer unknown とする。

V1 の normal-adult cold seed は、V1が冠床を明示する3枚のventricular wall、すなわちLVFW + SEP + RVFWの
model material volumeとdensityから得る心室心筋質量 $M_{corbed}=146.3$ g に、whole-coronary
blood-volume prior 12 mL/100 g を掛けた

$$
V_{cor,cold}=146.3\frac{12}{100}=17.556\ \mathrm{mL}
$$

を exact TBV ledger とする。12 mL/100 gと、その約1/3を占めるintramyocardial blood volume
4 mL/100 gは、contrast-echoを用いたlarge-mammal experiment/modelから移したpriorであり
([Jayaweera et al. 1999](https://doi.org/10.1152/ajpheart.1999.277.6.H2363)、
[Wei et al. 1998](https://doi.org/10.1016/S0735-1097(98)00212-5))、正常ヒト集団の確定値ではない。
$146.3$ gも文献定数ではなく、このreleaseのLVFW + SEP + RVFW material volumeとdensityから得る
model-mass bindingである。atriaはV1で明示的冠床を持たないため、このbindingから除外する。したがって
17.556 mLは**文献priorとmodel massから構成した数値ledger**であり、一人の被験者で同時測定した
冠血液量ではない。

authoritative full-graph TBVは5600 mLのまま変えない。旧noncoronary releaseは将来の冠床として77.89 mLを
除外し、15 nodeを5522.11 mLとしていた。V1の明示的冠10 nodeが17.556 mLであるため、差

$$
\Delta V_{SV+VC}=77.89-17.556=60.334\ \mathrm{mL}
$$

を既存canonical initializationと同じshared transmural-pressure offsetでnoncoronary `SV` / `VC`へ一度だけ戻し、
noncoronary 5582.444 mL + coronary 17.556 mL = 5600 mLとする。SVだけへarbitrary volumeを直接加えず、
両complianceのpressure continuityを保つ。これはmigration時の初期ledger操作であって、各step後の
volume projectionではない。
source、mass binding、各nodeへの配分、migration前後のTBV差をrelease artifactに記録する。

## 6. vascular pressure–volume law

### 6.1 epicardial artery と coronary sinus

epicardial arterial node と common coronary sinus は、normal operating range で collapse させる ownerではない。
canonical V1 はそれぞれ linear transmural compliance を使う。

$$
P_{A,k}^{abs}
=P_{ext}^{abs}+\frac{V_{A,k}-V_{u,A,k}}{C_{A,k}},
$$

$$
P_{CS}^{abs}
=P_{ext}^{abs}+\frac{V_{CS}-V_{u,CS}}{C_{CS}}.
$$

$P_{ext}^{abs}$ は whole-heart boundary が一度だけ供給する common perivascular external pressureである。
$C>0$、$V_u\ge0$ を release validationで要求する。これらの linear law は文献の普遍式ではなく、V1 の
state数と識別可能性を抑える工学的縮約である。epicardial collapse、myocardial bridge、局所外圧は V1 scope外とする。

### 6.2 intramyocardial collapsible tube law

文献priorから配る$V_{cold,i}$はloaded diastolic blood volumeであり、zero-transmural-pressure volumeではない。
PV lawの$V_{0,i}$を別parameterとして持ち、各 intramyocardial layer compartment の normalized volume を

$$
v_i=\frac{V_i}{V_{0,i}}>0
$$

とし、transmural pressure を

$$
P_{tm,i}(V_i)
=P_{s,i}\left(v_i^{m_i}-v_i^{-n_i}\right),
\qquad P_{s,i}>0,\;m_i>0,\;n_i>0
$$

とする。接線は

$$
\frac{\partial P_{tm,i}}{\partial V_i}
=\frac{P_{s,i}}{V_{0,i}}
\left(m_iv_i^{m_i-1}+n_iv_i^{-n_i-1}\right)>0
$$

であり、$V_i\rightarrow0^+$ で pressure が大きく負になるため、hard zero-volume clamp なしに collapse を
抑制する。$P_{s}$ は pressure scale であり、zero-pressure tangent そのものではない。

normal releaseはloaded local transmural pressureをweak construction priorとして

$$
P_{tm,load}=5\ \mathrm{mmHg}
$$

と宣言する。$P_s=8$ mmHg、$(m,n)=(4,2)$の単調PV則を反転すると

$$
\lambda_{load}
=\frac{V_{cold,i}}{V_{0,i}}
\approx1.09814,
\qquad
V_{0,i}=\frac{V_{cold,i}}{\lambda_{load}}
$$

を**導出値**として得る。human angioplasty中にcoronary perfusion pressureが平均66.6 mmHg上がるとMBVが平均約46%増えたという
pressure-distensibility observation
([Indermühle et al. 2011](https://doi.org/10.1152/ajpheart.01022.2010))を機序根拠とするが、coronary perfusion
pressureとlocal vascular transmural pressureは同じcoordinateではない。そのため5 mmHgは同cohortへのfitではなく、
low-single-digit diastolic local pressureを置くweak priorである。$P_{tm,load}=3$--8 mmHg、
$m=2$--6をsensitivity rangeとし、ratio自体を独立fit parameterにしない。
`coldSeedVolumeMl`をそのまま`zeroTransmuralReferenceVolumeMl`へ代入する実装は受理しない。
一方、9節のcollapse-only hydraulic reference $V_{h,ref}$はloaded caliberの基準なので、V1では
$V_{h,ref}=V_{cold}$とし、PVの$V_0$とは意味を分ける。release artifactは$\lambda_{load}$、implied
$P_{tm,load}$、settled orbitで実際に得た$P_M-P_{IM}$を別fieldで記録する。

positive-pressure側を$m=4$でstiffeningさせるのは、正常なexogenous hyperemiaではflow増加が主にvelocityで生じ、
capillary blood volumeは大きく変わらないという実験
([Jayaweera et al. 1999](https://doi.org/10.1152/ajpheart.1999.277.6.H2363))と、上記human pressure-distensibilityを
同時に満たすためである。ただし$m=4$は一意な組織定数ではなく、hyperemia時のIM / total coronary blood-volume
expansionを別のacceptance metricとして拘束するreduced-model priorである。

$$
K_{0,i}
=\left.\frac{\partial P_{tm,i}}{\partial V_i}\right|_{V_i=V_{0,i}}
=\frac{P_{s,i}(m_i+n_i)}{V_{0,i}}.
$$

intramyocardial absolute pressureは

$$
P_{M,k,\ell}^{abs}
=P_{IM,k,\ell}^{abs}+P_{tm,k,\ell}(V_{M,k,\ell})
$$

である。この二冪 tube law は、[Kozlovsky et al. 2014](https://doi.org/10.1016/j.jbiomech.2014.04.033) の
general collapsible-tube family や Munneke らの nonlinear area lawを、0D volume stateに合わせて簡約した
本モデル固有の式であり、同論文の式を再現したものではない。

### 6.3 compartment-specific semantics

- $A_k$：linear terminal arterial storage。focal lesionとhealthy distributed arterial resistanceの両方より
  遠位にあり、massless post-lesion $P_d$ sampleとは区別する。
- $M_{k,\ell}$：IMP による compression と diastolic recoil を担う。EPI/ENDO で $V_0,P_s$ を分けられる。
- $CS$：linear low-pressure venous storage。common pericardial / intrathoracic external pressure を一度だけ受ける。

PV parameter を一つの mean flow に合わせて同定してはならない。compliance は phasic volume、arterial/venous
flow phase、または diameter data があるときにのみ更新する。

## 7. intramyocardial pressure: CEP + Land active stress

### 7.1 reference equation

Munneke らは3層 coronary model で、CEP と varying-elastance component を

$$
P_{IMP}
=\underbrace{dP_{cav}+(1-d)P_{peri}}_{CEP}
+\underbrace{\gamma\sigma_f}_{contraction-related}
$$

の形で結んだ。V1 は pressure reference を明確にするため、common external pressure を先に分離し、
次式を使う。

### 7.2 V1 equation

territory-to-wall weightを $w_{k,w}$、$w_{k,LVFW}+w_{k,SEP}+w_{k,RVFW}=1$ とする。
free-wall CEPは共通外圧から対応するcavity pressureへ補間する。septumでは一つのglobal depthを全territoryへ
流用せず、LADのENDOはLV-facing、RCAのENDOはRV-facingとなるterritory-local coordinateを使う。
septum内のLV-facing fractionを

$$
\xi_{k,\ell}
=
\begin{cases}
d_\ell, & k=\mathrm{LAD},\\
1-d_\ell, & k=\mathrm{RCA},\\
d_\ell, & k=\mathrm{LCx}\ \text{(septal weight is zero in V1)}
\end{cases}
$$

と定義すると、実装式は

$$
P_{IM,k,\ell}^{abs}
=P_{ext}^{abs}
+c_{LV,k,\ell}P_{LV}^{tm}
+c_{RV,k,\ell}P_{RV}^{tm}
+\gamma_k\frac{\sum_w w_{k,w}\sigma_{a,w}}{133.322},
$$

$$
c_{LV,k,\ell}
=d_\ell w_{k,LVFW}+\xi_{k,\ell}w_{k,SEP},
$$

$$
c_{RV,k,\ell}
=d_\ell w_{k,RVFW}+(1-\xi_{k,\ell})w_{k,SEP},
$$

$$
d_{EPI}=0.25,
\qquad
d_{ENDO}=0.75.
$$

$133.322$ は Pa/mmHg である。$P_{ext}^{abs}$ は common intrathoracic + pericardial base を含み、
$P_{LV}^{tm},P_{RV}^{tm}$ は同じ base を除いた chamber transmural pressure である。これにより common pressure を
二重加算しない。

Munneke らの3層 centroid $d=1/6,3/6,5/6$ を、半壁2層の centroid $1/4,3/4$ へ縮約した。
ここでEPI / ENDOはterritoryが灌流するventricular faceを基準とする局所labelである。したがってLADとRCAの
septal `subendocardial`は同じ空間側を意味せず、それぞれLV側とRV側を意味する。
$\gamma=0.06$ は同論文が fiber stress coupling に使用した値を normal-adult V1 の初期 prior とするが、
ヒトで一意に測定された普遍定数ではない。normal envelope はおおむね $0.03$--$0.10$ を機序確認域とし、
patient fitting は phasic flow / pressure の独立情報なしには許可しない。

### 7.3 active stress owner

$\sigma_{a,k}$ は total wall stressではなく、同じ candidate の Land active Kirchhoff fiber stress だけから作る。
passive stress と parallel SLS stress を再加算しない。normal-adult anatomy prior は

$$
\sigma_{a,LAD}=0.75\sigma_{a,LVFW}+0.25\sigma_{a,SEP},
$$

$$
\sigma_{a,LCx}=1.00\sigma_{a,LVFW},
$$

$$
\sigma_{a,RCA}=0.80\sigma_{a,RVFW}+0.20\sigma_{a,SEP}.
$$

これらは global hemodynamics から同定できない normal-adult territory prior であり、冠優位性や将来の
multipatch release は別の明示的 weight binding に置き換える。V1 では coronary ischemia が Land stressを
低下させる feedback を入れない。したがって低灌流時にもモデルが梗塞・stunningを自動発症したとは
解釈しない。

Rabbany らは fiber stress と intramyocardial fluid pressure の関連を示し
([PubMed](https://pubmed.ncbi.nlm.nih.gov/2764124/))、Algranati らは CEP と contraction-related component の
組合せが複数の観測を最もよく説明すると報告した。本式はその因果分離を Land kernel へ接続した縮約である。

### 7.4 left–right and transmural behavior

- LAD / LCx：高い LV pressure と active stressにより systolic compressionが強く、diastolic inflowが優位になる。
- RCA：normal RV pressureが低いため systolic flow が相対的に保たれる。
- RV pressure overload：RCA IMP が上がり、RCA も左冠に近い diastolic predominanceへ移る。
- ENDO：$d=0.75$ のため EPI より cavity pressureの影響が強く、低 perfusion pressure、高 LVEDP、頻脈で
  先に flow reserve を失う。

正常ヒトで LAD が強い diastolic flow、RCA がほぼ均等な systolic/diastolic flow を示すことは
[Marcus et al. 1999](https://pubmed.ncbi.nlm.nih.gov/10433289/) と
[Ofili et al. 1993](https://pubmed.ncbi.nlm.nih.gov/8488773/) の primary measurements を
qualitative / envelope gate とする。

## 8. signed flow law と collapsible-bed behavior

### 8.1 generic signed resistive edge

non-stenotic edge は

$$
Q=\frac{P_{up}^{abs}-P_{down}^{abs}}{R_{eff}},
\qquad R_{eff}>0
$$

とする。reverse flow を hard clamp しない。

### 8.2 intramyocardial edges

canonical V1 の layer inflow / outflow は

$$
Q_{A,k,\ell}
=\frac{P_{A,k}^{abs}-P_{M,k,\ell}^{abs}}
{R_{A,k,\ell}(V_{M,k,\ell})},
$$

$$
Q_{V,k,\ell}
=\frac{P_{M,k,\ell}^{abs}-P_{CS}^{abs}}
{R_{V,k,\ell}(V_{M,k,\ell})}
$$

である。IMP上昇時には tube lawによって $V_M$ が低下し、$P_M=P_{IM}+P_{tm}(V_M)$ が変化すると同時に、
$R_A(V_M)$ と $R_V(V_M)$ が増える。この保存されたstorage–caliber couplingだけで systolic impediment、
一時的なzero / reverse flow、外圧依存のzero-flow interceptを生じ得る。

V1 は、これに加えて

$$
P_{d,eff}=\max(P_d,P_{IM}+P_{crit})
$$

のような独立 downstream clampを置かない。collapsible PVと$R(V)$に同じcollapse physicsを再度加えると、
compressionを二重計上し、$P_{crit}$ と tube / IMP parameterが非識別になるためである。古典的 vascular waterfallは
**mechanistic ancestry と pressure–flow validation behavior**として扱い、canonical equationではない。
isolated pressure–flow gateをcollapsible PV + $R(V)$だけで満たせないことが再現性をもって示され、かつ独立データで
追加zero-flow offsetを拘束できる場合にのみ、将来の equation versionで再検討する。波形fittingのために
$P_{crit}$ を後付けしてはならない。

Downey と Kirk の実験的 waterfall mechanism
([DOI](https://doi.org/10.1161/01.RES.36.6.753)) と、Burattini らの proximal compliance + resistance +
intramyocardial compliance 同定を、このbehavioral gateの根拠とする。

### 8.3 CS outflow

$$
Q_{CS}=\frac{P_{CS}^{abs}-P_{RA}^{abs}}{R_{CS}}.
$$

RA pressure 上昇は coronary venous pressure を上げ、冠灌流を減らし得る。この作用を別の `venous congestion`
補正で重複させない。

## 9. volume-dependent microvascular resistance

固定長かつhydraulic volume $V\propto A$ とみなせば、Poiseuille 則 $R\propto r^{-4}\propto A^{-2}$ から

$$
R(V)\propto V^{-2}
$$

を得る。ただしChilian由来のtone stateがrest-to-hyperemia dilationを既に所有するため、$R(V)$をdistension側でも
$V^{-2}$で下げるとvasodilationを二重計上する。そこで$R(V)$は**collapse-only caliber modifier**とする。
$V_{h,ref}$をloaded reference hydraulic volume、$x=V/V_{h,ref}$、
$\bar x=\min(1,\max(0,x))$、residual hydraulic area fractionを$\epsilon_A\in(0,1)$として

$$
s(\bar x)=\bar x^2(3-2\bar x),
$$

$$
a(\bar x)=\epsilon_A+(1-\epsilon_A)s(\bar x),
\qquad
\phi_C(V)=a(\bar x)^{-2}
$$

とする。したがって$V\ge V_{h,ref}$では厳密に$\phi_C=1$かつ$d\phi_C/dV=0$であり、hyperemic distensionは
追加resistance gainを生まない。collapse側では$1\le\phi_C\le\epsilon_A^{-2}$で、$0<x<1$のanalytic derivativeは

$$
\frac{d\phi_C}{dV}
=-\frac{12(1-\epsilon_A)\bar x(1-\bar x)}
{V_{h,ref}a(\bar x)^3}\le0
$$

である。smoothstepによりcollapse thresholdとcomplete-collapse endpointで一階微分も連続になる。
tone $r_k$ は二つのresistance ownerへ同じstateから異なるgainで配る。

healthy distributed arterial / prearteriolar resistanceは

$$
R_{D,k}(r_k)=R_{D0,k}\,r_k^{\alpha_D},
\qquad
\alpha_D
=\frac{\ln(6/17)}{\ln(4/45)}
\approx0.4303,
$$

intramyocardial layer arteriolar / venular resistanceは

$$
R_{A,k,\ell}
=R_{A0,k,\ell}\,\phi_C(V_{M,k,\ell})\,
r_k\,s_{CMD,k},
$$

$$
R_{V,k,\ell}
=R_{V0,k,\ell}\,\phi_C(V_{M,k,\ell})
$$

である。$s_{CMD}$ はtone stateから独立したterritory structural microvascular disease scaleである。
redundantな `toneScaleMultiplier` は置かない。venular sideはfixedとし、同じtoneを二重適用しない。
$\alpha_D$ と後述する $r_{min}=4/45$ は、Chilianらがcontrolからdipyridamoleへ arterial resistance
$17\rightarrow6$、microvessel resistance $45\rightarrow4$ mmHg min g/mLを観察した比を、一つのtone stateへ
写像するreduced priorである
([PubMed](https://pubmed.ncbi.nlm.nih.gov/2492768/))。これは麻酔下cat実験のpopulation truthではなく、
healthy reserveを表現するためのrelease priorである。$\epsilon_A$はcomplete-collapseでのfinite upper boundを与える
numerical / structural priorで、臨床knobにしない。tone ablationと$\phi_C$ ablationを別々に行い、rest-to-hyperemia
flow gainを$\phi_C$が所有していないことをfactorial testで確認する。

Hiramatsu らは beating canine heart で intramural arteriole diameter が end-diastole から end-systoleへ
平均約10%低下することを観察した。本モデルはその diameter変化を直接 fitせず、volume-dependent caliberの
符号と phasic effect の妥当性確認に用いる。

## 10. epicardial stenosis: Young–Tsai reduced loss

### 10.1 adopted law

focal lesionとhealthy distributed arterial lossを同じ抵抗にまとめない。各branchで、まずmassless
post-lesion pressure $P_{d,k}$ を

$$
P_{Ao}^{abs}-P_{d,k}^{abs}
=R_{sten,k}Q_{Ao,k}
+B_{sten,k}Q_{Ao,k}|Q_{Ao,k}|
$$

から求め、その後

$$
P_{d,k}^{abs}-P_{A,k}^{abs}
=R_{D0,k}r_k^{\alpha_D}Q_{Ao,k}
$$

でterminal arterial storage $A_k$へ接続する。両式の$Q_{Ao,k}$は同一で、$P_d$はmassless algebraic sampleである。
病変なしでは $R_{sten}=B_{sten}=0$ なので $P_d=P_{Ao}$ が厳密に成立し、healthy distributed resistanceは
FFR-likeのlesion dropへ混入しない。

canonical implementationは健康径 $D_0$、病変径 $D_s$、病変長 $L_s$、粘性 $\mu$、密度 $\rho$、
separation coefficient $K_{sep}$ から、健康な同一長さの損失を差し引いたincremental coefficient

$$
R_{sten}
=\frac{128\mu L_s}{\pi}
\left(\frac{1}{D_s^4}-\frac{1}{D_0^4}\right),
$$

$$
B_{sten}
=\frac{\rho K_{sep}}{2}
\left(\frac{1}{A_s}-\frac{1}{A_0}\right)^2,
\qquad K_{sep}=1.52
$$

をSI unitで評価し、mmHg–s–mL unitへ変換する。これはYoung–Tsaiのviscous + separation-loss structureを
採ったreduced mappingであり、原著係数式の逐語的再実装ではない。$D_s=D_0(1-s_D)$、
$A_s=A_0(1-s_D)^2$ なので、$s_D=0$ では追加linear / quadratic lossが厳密に0になる。

原著の steady / unsteady stenosis experiment は
[Young & Tsai 1973 Part I](https://doi.org/10.1016/0021-9290(73)90099-7) と
[Part II](https://doi.org/10.1016/0021-9290(73)90012-2) を参照する。
係数式は実験形状への semi-empirical relation であり、患者 lesion の irregularity、eccentricity、連続病変を
完全に表すものではない。

### 10.2 V1 で除く項

Young–Tsai の unsteady form にある

$$
K_u\rho\frac{L_s}{A_0}\dot Q
$$

は V1 では入れない。理由は、現在の目的が mean / phasic coronary perfusion と stenosis reserve であり、
0D proximal complianceが既に memoryを持つ一方、病変固有 inertance を追加すると parameter confounding と
高周波数値 mode が増えるためである。pressure / flow wave propagation や iFR wave-free mechanics を研究する
段階で、1D conduit modelとともに再検討する。

### 10.3 control semantics

canonical state / API の primary lesion control は `% diameter stenosis` $s_D$ とする。円形断面のderived
area reductionは

$$
s_A=1-(1-s_D)^2
$$

として併記できるが、diameter stenosis と area reduction を同じfieldへ保存しない。
`50% diameter stenosis` は `50% area stenosis` ではない。$D_0,L_s$ が imaging から与えられない場合は
release-bound effective geometry を用い、UI に `effective research lesion, not QCA` と明記する。

### 10.4 dissipativity and reverse flow

$$
\Delta P_{loss}Q
=R Q^2+B|Q|^3\ge0
$$

を unit test する。reverse flow でも quadratic loss の符号を反転させ、常に energyを散逸させる。

## 11. territory autoregulation

### 11.1 state semantics

各 territory の resistance scale $r_k$ は

$$
r_{min,k}\le r_k\le r_{max,k},
\qquad y_k=\ln r_k
$$

を満たす。canonical default は

$$
r_{min}=\frac{4}{45}\approx0.0889,
\qquad r_{max}=2.0,
\qquad \tau_{tone}=5\ \mathrm{s},
$$

$$
g_{met}=1.0,
\qquad g_{myo}=0.25.
$$

$r=1$ は normal release の resting resistance scale、$r_{min}$ は最大拡張、$r_{max}$ は最大収縮側である。
表示用 tone は

$$
tone01_k
=\frac{\ln r_k-\ln r_{min,k}}
{\ln r_{max,k}-\ln r_{min,k}}
$$

とする。`tone01=0` は maximum dilation、`1` は maximum constrictionである。

### 11.2 target law

accepted beat / window から得た mean flow $\bar Q_k$、mean effective perfusion pressure $\bar\Pi_k$、
demand target $Q_{target,k}$ を使い、unclamped target を

$$
y_k^*
=g_{met,k}\ln\left(\frac{\bar Q_k}{Q_{target,k}}\right)
+g_{myo,k}\ln\left(\frac{\bar\Pi_k}{\Pi_{ref,k}}\right)
$$

とする。

$$
\hat y_k
=\operatorname{clip}
\left(y_k^*,\ln r_{min,k},\ln r_{max,k}\right).
$$

flow が target より低ければ第1項は負となり dilation、perfusion pressure が高ければ第2項は正となり
myogenic constrictionを促す。これは myogenic、metabolic、flow-dependent regulation を個別に同定する
式ではなく、同じ向きの organ-level response を一つの actuator に集約した縮約である。

Cornelissen らの多段 coronary-tree modelは、myogenic、flow-dependent、metabolic mechanism のバランスが
autoregulation に必要であることを示した
([PubMed](https://pubmed.ncbi.nlm.nih.gov/12003832/))。V1 は同論文の10段 resistance treeを
再実装せず、1-state approximation とする。

### 11.3 pharmacologic hyperemia

hyperemia drive $h_k\in[0,1]$ に対し

$$
y_{target,k}
=(1-h_k)\hat y_k+h_k\ln r_{min,k}.
$$

$h=1$ は tone target を最大拡張へ移すが、state を一ステップで置換しない。保持された target に対し

$$
y_{k,n+1}
=y_{target,k}
+\left(y_{k,n}-y_{target,k}\right)
\exp\left(-\frac{\Delta t}{\tau_{tone,k}}\right)
$$

と exact relaxation する。FFR / CFR protocol は十分な wash-in と stable-hyperemia gate を要求する。

hyperemiaの**唯一のownerはこのslow accepted-tone target / protocol**である。hydraulic residualはaccepted
$r_k$だけを読み、$h_k$を直接読んでeffective resistanceをもう一度blendしてはならない。したがって
`CoronaryDiseaseInput.hyperemia01`やalgebraic `hyperemicTone`はcanonical V1 APIに置かない。これにより中間
$0<h<1$での二重拡張を防ぎ、wash-in / recoveryを同じaccepted-state trajectoryとして再現する。

### 11.4 averaging owner

tone kernel 自身は running mean state を持たない。whole-heart transaction / protocol owner が accepted
sample だけから $\bar Q,\bar\Pi,Q_{target}$ を構成し、pure tone updateへ渡す。Newton trial中の candidateを
meanへ混ぜない。これにより tone の生理 state は3個のままで、window / beat semanticsを protocolごとに
明示できる。

### 11.5 demand target

V1 release は、territory mass / flow share に基づく resting $Q_{ref,k}$ を必須 binding とする。kernel API は
$Q_{target,k}$ を外部入力として受けるため、次の2段階を区別する。

1. **canonical V1**：$Q_{target,k}=s_{demand,k}Q_{ref,k}$。$s_{demand}=1$ が normal restである。
2. **mechanics-informed protocol / future release**：territory active-stress-time index
   $HR\int_{beat}\max(\sigma_{a,k},0)dt$ または PVA-informed ownerから $s_{demand}$ を導く。

Land stress-time index は ATP消費や MVO$_2$ そのものではない。Suga らが示した PVA と oxygen consumption の
関連 ([PubMed](https://pubmed.ncbi.nlm.nih.gov/3591971/)) を根拠に将来の demand ownerを設計できるが、
V1 で酸素輸送・抽出を実装しない以上、表示名は `mechanical demand index` とし、`MVO2` と呼ばない。

### 11.6 dynamic prior

$\tau=5$ s は universal smooth-muscle constantではない。冠循環の pressure / volume step responseに
約1.8--4 sの時定数が報告され、急な heart-rate change後に速い mechanical phase と遅い regulation phaseが
分かれることを踏まえた numerical / physiological prior である
([Dankelman et al. 1990](https://pubmed.ncbi.nlm.nih.gov/2376989/))。2--10 s を sensitivity envelopeとし、
患者同定は連続 transient dataなしに行わない。

## 12. perfusion pressure、flow、phase metric の定義

### 12.1 accepted mean perfusion pressure

tone kernelは perfusion pressureのrunning filterや追加stateを所有せず、whole-heart / protocol ownerから
accepted aggregate $\bar\Pi_k$ を受け取る。canonical normal-adult V1 binding は branch-to-coronary-sinus gradient

$$
\bar\Pi_k
=\left\langle P_{A,k}^{abs}(t)-P_{CS}^{abs}(t)\right\rangle_{accepted}
$$

とする。これは regulated microvascular bed に利用可能なmean pressure gradientの縮約であり、局所smooth-muscle
transmural pressureを直接測定した量ではない。Ao–RA gradientではなくterminal arterial storage pressure $P_A$と
CS pressureを使うため、
epicardial lesion lossと冠静脈圧上昇がsignalに反映される。IMPの効果はphasic $P_M$、$R(V_M)$、およびmean-flow
errorを介してtoneへ入る。

診断用には各層の実際の signed arteriolar gradient

$$
\Delta P_{A,k,\ell}(t)
=P_{A,k}^{abs}(t)-P_{M,k,\ell}^{abs}(t)
$$

も別observableとして保持するが、これをsilentにtone inputへ差し替えない。myogenic signalを局所transmural pressureへ
変更する場合は equation / protocol versionを上げる。negative / near-zero $\bar\Pi_k$ を logへ直接渡さず、
physiology-invalid QCを出したうえでtone lawには明示したpositive signal floorを使う。floorで低灌流failureを
正常化してはならない。

### 12.2 mean flow

territory tissue flow は

$$
\bar Q_k
=\sum_{\ell}\left\langle Q_{V,k,\ell}\right\rangle
$$

を primary とする。periodic stateでは mean inlet と mean outlet は一致する。両者の差

$$
\epsilon_{storage,k}
=\left\langle Q_{Ao,k}\right\rangle
-\sum_\ell\left\langle Q_{V,k,\ell}\right\rangle
$$

を storage closure QC として表示する。未収束 beat の inlet flowだけを tissue perfusion と呼ばない。

### 12.3 systole / diastole

V1 の phase owner は ECG surrogate の固定 fractionではなく、ventricular mechanics / valve eventを使う。

- systole：AV valve closureから semilunar valve closureまで
- diastole：semilunar valve closureから次の AV valve closureまで

弁逆流やevent ambiguityがある場合は、phase metricに `event-ambiguous` を付ける。forward diastolic fractionは

$$
DF_k^+
=\frac{\int_{diastole}\max(Q_{Ao,k},0)dt}
{\int_{cycle}\max(Q_{Ao,k},0)dt}
$$

とし、net diastolic fraction

$$
DF_k^{net}
=\frac{\int_{diastole}Q_{Ao,k}dt}
{\int_{cycle}Q_{Ao,k}dt}
$$

を別 fieldにする。逆流があると両者は異なるため、UI legendで区別する。

### 12.4 transmural flow ratio

$$
EER_k
=\frac{\bar Q_{k,ENDO}/M_{k,ENDO}}
{\bar Q_{k,EPI}/M_{k,EPI}}
$$

を ENDO/EPI perfusion ratio とする。territory layer mass $M$ を持たない releaseでは、単なる layer-flow ratioを
`flow split`, not `mL/min/g` と表示する。正常ヒトの rest ENDO/EPIが約1.2--1.35、adenosine時に1へ近づくという
観測は [Danad et al. 2011](https://pmc.ncbi.nlm.nih.gov/articles/PMC3143328/) および
[George et al. 2011](https://pubmed.ncbi.nlm.nih.gov/22143171/) の envelopeを参考にするが、画像法・層定義の
違いを無視した一点 fitはしない。

## 13. normal-adult prior と parameter envelope

以下は initial research envelope であり、正常診断域や患者分布ではない。release artifact は実際に採用した
単一値、source、hashを固定する。

| parameter / observable | normal prior / exploration envelope | owner / 解釈 |
|---|---:|---|
| territory | LAD / LCx / RCA | topology、固定 |
| explicit coronary-bed mass | 146.3 g = LVFW + SEP + RVFW | model material volume × density。atriaを含めないrelease binding |
| authoritative full-graph TBV | 5600 mL | whole-heart ledger。coronary追加時も不変 |
| layer depth $d$ | 0.25 / 0.75 | 2層 centroid、固定 |
| wall weights / septal orientation | LAD 0.75 LVFW + 0.25 SEP (LV-facing); LCx 1.0 LVFW; RCA 0.80 RVFW + 0.20 SEP (RV-facing) | normal-adult anatomy prior。global dataからfitしない |
| active-stress gain $\gamma$ | 0.06; 0.03--0.10 sensitivity | IMP coupling。患者 knobにしない |
| intramyocardial tube $(P_s,m,n)$ | 8 mmHg, $(4,2)$ initial; $m=2$--6 sensitivity | asymmetric collapse / positive-pressure stiffening。release-bound |
| loaded local $P_{tm}$ | 5 mmHg; 3--8 mmHg sensitivity | weak construction prior。literature estimateではない |
| loaded / zero-Ptm volume ratio $\lambda_{load}$ | 1.09814 derived | $P_{tm,load}$とtube lawから導出し、独立fitしない |
| PV zero-Ptm volume $V_0$ | $V_{cold}/\lambda_{load}$ | literature loaded volumeそのものではない |
| collapse hydraulic reference $V_{h,ref}$ | loaded cold volume | toneと独立したcompression threshold |
| residual hydraulic area $\epsilon_A$ | 0.10 initial | collapse-only $R(V)$ upper-bound regularization。clinical knobにしない |
| $r_{min}$ | $4/45\approx0.0889$; 0.05--0.25 sensitivity | maximum-dilation microvascular resistance scale |
| distributed arterial tone exponent $\alpha_D$ | 0.4303; 0.2--0.7 sensitivity | $r_{min}^{\alpha_D}=6/17$を満たすreduced Chilian binding |
| $r_{max}$ | 2.0; 1.2--4.0 | maximum constriction scale |
| $\tau_{tone}$ | 5 s; 2--10 s | regulation transient |
| $g_{met}$ | 1.0; 0.5--2.0 | flow-error feedback |
| $g_{myo}$ | 0.25; 0--0.75 | pressure feedback |
| $\Pi_{ref}$ | 85 mmHg initial | autoregulation normalization。diagnostic thresholdではない |
| lesion diameter stenosis $s_D$ | 0; 0--0.90 research | canonical focal stenosis input。area reductionはderived |
| lesion length | 10 mm release prior; 2--30 mm research | imaging-informed only |
| healthy diameter | LAD 3.2 / LCx 3.0 / RCA 3.2 mm; 1.5--5 mm research | imaging-informed only |
| blood $\mu,\rho,K_{sep}$ | 0.0035 Pa s, 1060 kg/m$^3$, 1.52 | Young–Tsai mapping release prior |
| structural microvascular resistance scale $s_{CMD}$ | 1; 0.5--3 | CMD research axis。tone / hyperemiaとは別owner |
| compliance scale | 1; 0.5--2 | phasic storage research axis |
| demand scale | 1; 0.5--3 | mechanical-demand target, not MVO$_2$ |
| total resting MBF | approximately 0.6--1.2 mL/min/g | clinical envelope when myocardial mass exists |
| coronary flow / net CO | approximately 3--7% | coarse whole-heart envelope only |
| healthy CFR | approximately 2.5--5 | protocol / modality dependent |
| rest ENDO/EPI | approximately 1.0--1.4 | mass-normalized envelope |
| healthy hyperemic FFR-like | near 1, expected >0.95 without lesion | protocol QC, not diagnosis |

健康ボランティアで rest MBF 0.64--0.65 mL/min/g、dipyridamoleで1.59--1.78 mL/min/g、CFR約2.5--2.8が
MRI / PETで報告されている
([Chareonthaitawee et al. 2001](https://pubmed.ncbi.nlm.nih.gov/11241807/))。別の $^{15}$O-water PET studyでは
rest約0.7--0.8、stress約3.3--3.8 mL/min/g、CFR約4.3--4.6も報告されている
([PubMed](https://pubmed.ncbi.nlm.nih.gov/28585219/))。したがって一つの CFR値へ
fitするより、protocol、tracer、pressure、heart rate、demandの違いを残す。

normal territory flow share の初期値は、冠優位性と myocardial mass allocationを持たない global dataから
一意に同定できない。LAD / LCx / RCA の resistance、$Q_{ref}$、layer massを一つの release bindingとして
管理し、shareだけを独立 knobにしない。

### 13.1 provisional normal-adult hydraulic seed

pure kernelの初期release bindingは次を使う。これはhuman population estimateではなく、healthy closed-loopを
探索するための**provisional numerical prior**である。target total flow 146.3 mL/minは、explicit coronary-bed
mass 146.3 gへ1.00 mL/min/gでbindしたround release targetであり、一被験者の測定値ではない。
territory shareはLAD / LCx / RCA = 42 / 28 / 30%とし、血液volumeも同じshareで配る。

| node / target | LAD | LCx | RCA |
|---|---:|---:|---:|
| target resting territory flow [mL/min] | 61.446 | 40.964 | 43.890 |
| terminal arterial cold volume [mL] | 3.357 | 2.238 | 2.398 |
| terminal arterial unstressed volume [mL] | 1.813 | 1.209 | 1.295 |
| terminal arterial compliance [mL/mmHg] | 0.01817 | 0.01211 | 0.01298 |
| IM EPI loaded cold volume [mL] | 1.165 | 0.777 | 0.832 |
| IM ENDO loaded cold volume [mL] | 1.293 | 0.862 | 0.924 |

volume constructionは、explicit ventricular coronary-bed volume 17.556 mLからintramyocardial 5.852 mLと
CS 3.71 mLを先に取り、残る7.994 mLをterminal arterial storageへ配分する。CS cold seed 3.71 mLは、
49例のcontrast CTで報告された
human coronary-sinus anatomic volume $3.71\pm1.64$ mLをtransferした値である
([Młynarska & Młynarski 2024](https://doi.org/10.5114/pjr/191535))。ただし同研究はcompliant blood storageを
同定していないため、$C_{CS}=0.218$ mL/mmHgと$R_{CS}=0.10$ mmHg s/mLはrelease priorとして別に扱う。
RA 5 mmHg、common external pressure 2 mmHg、total rest flow 146.3 mL/minでcold pressureを整合させると
$V_{u,CS}=3.003$ mLとなる。10 nodeの合計cold volumeは17.556 mLで、5節のTBV ledgerと一致する。

reference pressure drop 85 mmHgに対し、resting resistance budgetのprovisional shareを healthy distributed arterial 0.28、
layer arteriolar 0.65、layer venular 0.07として

$$
R_{D0,k}=0.28\frac{85}{Q_{ref,k}},
\qquad
R_{A0,k,\ell}=0.65\frac{85}{f_{k,\ell}Q_{ref,k}},
\qquad
R_{V0,k,\ell}
=\frac{0.07(85)-Q_{ref,total}R_{CS}}
{f_{k,\ell}Q_{ref,k}}
$$

を作る。ここでflowはmL/sへ変換し、$f_{EPI}=1/2.11$、$f_{ENDO}=1.11/2.11$である。
venous 7% budgetには全layerに共通series edgeであるCS outletも含まれるため、layer venuleへ配る前に
$Q_{ref,total}R_{CS}$を一度だけ差し引く。これにより同じvenous pressure lossを二重計上しない。
最大拡張時にdistributed arterial shareは $r_{min}^{\alpha_D}=6/17$、layer arteriolar shareは
$r_{min}=4/45$へ低下し、venular / CS shareは固定される。このprovisional budgetのaggregate static idealized
reserveは

$$
\left[0.28\frac{6}{17}+0.65\frac{4}{45}+0.07\right]^{-1}
\approx4.41
$$

であり、maximum dilationでrest bindingより十分低いstatic resistanceへ移れることを確認する。これは
static diastolic componentの抵抗配分checkにすぎない。absolute MBFやCFRのrelease gateには使わず、
phasic compression、CS resistance、pressure shift、volume dependenceを含むwhole-cycle accepted periodic orbitで
再検証する。
現branchのAo 95 / RA 5 / external 2 mmHg、low-diastolic IMP固定component checkでは、rest flow
約154 mL/min、maximum-dilation flow約684 mL/min、static reserve約4.44である。IM blood volumeは
rest約5.71 mLからhyperemia約7.37 mL（比1.29）、total coronary volumeは16.68から17.92 mL（比1.07）で、
旧linear expansion則のmulti-fold capacitance gainを除いた。acceptanceはIM ratio <1.5、total ratio <1.2の
broad numerical gateとし、これもhealthy periodic physiologyの代用にはしない。
この配分は文献から一意に決まる解ではない。healthy settling後も、mean flowだけを合わせて各shareを自由化せず、
arterial / venous phasic flowとlayer ratioを含むvalidationを通してからrelease-bound parameterとして固定する。

## 14. CFR protocol

### 14.1 definition

territory CFR は

$$
CFR_k
=\frac{\bar Q_{k,hyperemia}}{\bar Q_{k,rest}}
$$

とする。Gould らが示した coronary flow reserve の原理と、stenosisがrest flowよりhyperemic reserveを
先に低下させる実験結果を根拠とする
([Gould et al. 1974](https://pubmed.ncbi.nlm.nih.gov/4808557/)、
[Gould & Lipscomb 1974](https://doi.org/10.1016/0002-9149(74)90092-7))。

### 14.2 protocol sequence

1. source scenario が P1 periodic gateを満たすことを確認する。
2. source checkpointを read-only forkする。
3. rest beatを同じ phaseから1拍再生し、closureを再確認する。
4. $h_k$ を smooth rampで0から1へ上げる。global hyperemiaでは全 territory、selective protocolでは対象だけ。
5. $r_k$ が $r_{min}$ の1%以内、mean flow driftが連続3拍で規定 tolerance以内になるまで wash-inする。
6. stable hyperemic 2--3 beatを measurement windowとする。
7. $h=0$へ戻し、recoveryを追跡する。source session自体は変更しない。

### 14.3 fixed and changing variables

CFR protocol中は lesion geometry、TBV、oxygen content surrogate、myocardial mass、Land parameterを固定する。
closed-loopで hyperemiaにより Ao pressure / CO が変わることは隠さず記録する。`pressure-normalized CFR` を
追加する場合も raw CFRと置換しない。

### 14.4 QC

- rest / hyperemia のどちらかが未収束、P2 suspect、solver failureなら reject
- $r_k$ が dilation targetへ到達していなければ `incomplete-hyperemia`
- mean Ao pressureが大きく変化した場合は `pressure-shifted-CFR`
- net tissue storage closure不良なら reject
- negative net territory flowなら ratioを出さない

CFR低下は epicardial stenosisとCMDの双方で起きるため、CFRだけで lesion locationを診断しない。

## 15. hyperemic FFR-like protocol

### 15.1 definition

Pijlsらの myocardial FFR は maximal hyperemiaにおける最大flow比で、pressureから

$$
FFR_{myo}
=\frac{P_d-P_v}{P_a-P_v}
$$

として求められる
([Pijls et al. 1995](https://pubmed.ncbi.nlm.nih.gov/7586302/)、
[Pijls et al. 1996](https://pubmed.ncbi.nlm.nih.gov/8637515/))。V1 の model-derived valueは

$$
FFR_k^{like}
=\frac{\langle P_{d,k}^{abs}-P_{RA}^{abs}\rangle_H}
{\langle P_{Ao}^{abs}-P_{RA}^{abs}\rangle_H},
$$

ここで $H$ は stable maximal-hyperemia windowである。Pijls式の$P_v$はmean RA / CVPに対応し、V1の
冠床もCS outletを経てRAを終端とするため、denominator correctionには$P_{RA}$を使う。$P_{CS}$を使うと
CS outlet lossを除外し、flowが増えるhyperemiaほどsystematic biasになる。$P_{d,k}$ はfocal lesion直後・healthy distributed
arterial resistance直前のmassless algebraic sampleであり、terminal storage pressure $P_{A,k}$ ではない。
zero-lesionでは $P_d=P_{Ao}$ のため、numerical tolerance内で $FFR^{like}=1$ が構造的に成立する。

### 15.2 label boundary

これは catheter pressure-wire measurement ではないため、UI labelは `model FFR-like (hyperemic)` とする。
次の場合は値を出さない。

- $h_k<1$ または toneが maximum dilation gate未達
- hyperemic periodic / stationary gate未達
- pressure denominatorが小さい、または符号不正
- lesion distal pressureの sampling locationが未定義

通常の simulation中に表示できる

$$
PdPa_{rest,k}
=\frac{\langle P_{d,k}\rangle_{rest}}{\langle P_{Ao}\rangle_{rest}}
$$

は `resting distal/aortic pressure ratio` と呼び、FFR fieldへ入れない。

### 15.3 interpretation

clinical threshold 0.80 は invasive measurement、適切な hyperemia、患者集団で検証された decision threshold
である。本モデルの $FFR^{like}\le0.80$ を、そのまま治療適応または虚血診断として色分けしない。まず healthy、
known focal stenosis、CMDでの構造的識別力を検証し、diffuse diseaseは専用owner実装後に別validationを行う。

## 16. oxygen supply / demand の表示境界

V1 は oxygen content、hemoglobin、saturation、extraction、lactateを stateとして持たない。したがって

$$
S/D_k
=\frac{\bar Q_k/\bar Q_{ref,k}}
{Q_{target,k}/Q_{ref,k}}
$$

を `relative flow-to-demand index` として advisory表示できるが、oxygen supply/demand ratio、ischemia probability、
MVO$_2$ と呼ばない。

anemia、hypoxemia、sepsis、cyanosisを扱うには

$$
DO_{2,k}=Q_k C_{aO_2},
\qquad
MVO_{2,k}=Q_k(C_{aO_2}-C_{vO_2,k})
$$

を持つ oxygen transport moduleが必要であり、V1 scope外である。

## 17. disease / clinical research envelope

### 17.1 focal epicardial CAD

変更 owner：対象 branch の $A_s/A_0,L_s,D_0$。

期待応答：

- mild/moderate域では autoregulation により rest flowが比較的保たれる
- hyperemic flow と CFR が先に低下する
- high flowで quadratic pressure loss が増え、FFR-likeが低下する
- severe域では toneが dilation floorへ達し、rest flowも低下する
- ENDO/EPIが低下しやすい

狭窄率だけで症例fitせず、rest/hyperemic flow、distal pressure、lesion geometryのうち複数を要求する。

### 17.2 diffuse epicardial disease

focal $B_{sten}$ を大きくして擬似化せず、healthy tone-responsive $R_D$をそのまま`diffuse CAD`と呼ばない。
diffuse diseaseにはtone非依存のdistributed structural lossとpressure-pullback semanticsが必要である。
canonical V1はこの専用ownerをまだ持たないため、V1.1以降のequation / observable versionとして扱う。
V1でのglobal arterial-resistance sensitivityは機序実験に限定し、diffuse CAD presetや診断labelを付けない。

### 17.3 coronary microvascular dysfunction (CMD)

変更 owner：$R_{A0}$ scale上昇、$r_{min}$上昇、$r_{max}/r_{min}$範囲低下、必要に応じ compliance低下。

期待応答：

- CFR低下
- focal lesionなしでは hyperemic epicardial pressure dropは比較的小さく、FFR-likeは保たれ得る
- rest flowは代償により正常または高値もあり得る
- phasic volume変化 / ENDO/EPIが変化し得る

`CMD` presetは一つの病理を表すのではなく、reduced vasodilatory capacityのresearch phenotypeである。
endothelial dysfunction、smooth-muscle dysfunction、capillary rarefactionを個別診断しない。

### 17.4 hypotension / shock

coronary parameterを直接変えず、systemic circulationで Ao pressureを低下させる。toneは dilation floorへ向かい、
それでも perfusionを維持できない領域を示す。低血圧 presetで隠れた coronary resistance補正を入れない。

### 17.5 tachycardia

HRを whole-heart ownerで上げる。短い diastole、incomplete decompression、固定または mechanics-informed demand
targetにより reserve低下を調べる。HRに比例して resistanceを直接下げる ad-hoc lawは置かない。

### 17.6 high LVEDP / HFpEF-like load

LV filling pressureとpassive mechanicsを whole-heart側で変更し、diastolic CEP上昇がENDO perfusionを低下させる
かを見る。CMD parameterを同時に変える場合は factorial scenarioとして分離する。

### 17.7 LV hypertrophy / aortic stenosis

wall geometry / mass、Ao valve EOA、Land mechanicsの変更が、高systolic IMP、demand、diastolic pressure-time、
ENDO/EPIへ伝わる。冠血流波形を合わせるために $\gamma$ を症例ごとに自動fitしない。Munnekeらの closed-loop
modelが aortic stenosis前後の phasic flow変化を再現したことを qualitative referenceとする。

### 17.8 RV pressure overload / pulmonary hypertension

PVR / RV afterloadを whole-heart側で上げる。RCA systolic flowが低下し、diastolic fractionが増えることを
mechanism gateとする。RCAだけの compression scaleを病態補正として追加しない。

### 17.9 coronary venous congestion

RAP / pericardial pressureを上げ、CS pressureとeffective perfusion gradientを介して flowが低下することを確認する。
高RAP時にCS-to-RA edgeを一方向 clampしない。

### 17.10 research preset catalog

初期 catalog は次を推奨する。すべて `research bracket, not diagnosis` と明記する。

1. healthy normal-adult coronary V1
2. LAD focal stenosis: mild / intermediate / severe mechanism brackets
3. LCx focal stenosis
4. RCA focal stenosis
5. global CMD: reduced vasodilatory capacity
6. high-LVEDP with otherwise normal coronaries
7. AS + LVH interaction
8. tachycardia + low diastolic pressure
9. RV pressure overload
10. elevated RAP / coronary venous congestion

同じ病態名でも kernel parameterだけを変える presetと、whole-heart parameterを含む composite presetを別IDにする。

## 18. Workbench observable と UI

### 18.1 waveform / graph

初期 graph catalog は次を提供する。

- `Coronary inflow`: $Q_{Ao,LAD},Q_{Ao,LCx},Q_{Ao,RCA}$
- `Coronary tissue flow`: territoryごとの $\sum_\ell Q_{V,k,\ell}$
- `Transmural perfusion`: EPI / ENDO layer flow
- `Coronary pressure`: Ao、post-lesion $P_d$、terminal arterial storage $P_A$、CS、RA
- `Intramyocardial pressure`: territory × EPI/ENDO
- `Coronary PV`: $P_{tm}$–$V$ for selected microvascular compartment
- `Coronary tone`: $r_k$ または `tone01`
- `Stenosis pressure loss`: linear / quadratic / total component

waveformは既存 sweeping UI、scenario visibility、legend、pane settingsをそのまま使う。左冠の一過性逆流を
表示範囲の自動clipで消さない。flowが負になる場合のみ y-axisを0未満へ広げる。

### 18.2 primary metric

scenarioごとに次をまとめる。

- total / LAD / LCx / RCA mean tissue flow [mL/min]
- myocardial mass bindingがある場合の MBF [mL/min/g]
- coronary flow / net CO [%]
- forward and net diastolic fraction [%]
- EPI / ENDO mean flow、ENDO/EPI ratio
- mean effective perfusion pressure [mmHg]
- CS mean pressure / flow
- resting post-lesion distal/aortic pressure ratio
- current tone / reserve-to-floor
- relative flow-to-demand index
- storage closure、P1/P2、solver health

FFR-like と CFR は protocol result areaに置き、通常の live metric列へ常時出さない。

### 18.3 default controller subset

臨床 / 教育向け default subsetは、raw kernel parameterを全表示しない。

- LAD / LCx / RCA diameter stenosis [%]（derived area reductionを併記）
- coronary microvascular resistance scale
- coronary vasodilatory capacity
- mechanical demand scale
- coronary hyperemia protocol button
- coronary dominance research preset

advanced controller settingsには次を追加できる。

- effective lesion length / reference diameter
- focal linear / quadratic loss readback
- territory $R_{D0},R_{A0},R_{V0}$ scale
- $r_{min},r_{max},\alpha_D,\tau,g_{met},g_{myo}$
- EPI/ENDO resistance and compliance allocation
- $P_s,V_0,m,n$
- $\gamma$ と septal stress weight
- CS compliance / resistance
- demand-target territory share

$\gamma$、tube exponent、septal weightは `research / weakly identifiable` groupに置き、一般default knobにしない。

### 18.4 transition semantics

- lesion / resistance / demand controlの通常操作は live transitionをdefaultにする。
- tone stateはtransition中も保持し、新しい targetへ連続的に移る。
- parameter変更ごとに toneをnormal値へresetしない。
- explicit `next steady state` は同じ updated parameter subsetからforkし、P1 / P2 / failureを判定する。
- hyperemia / CFR / FFRは通常slider transitionではなく、source identityを固定したprotocol commandとする。

### 18.5 model-version semantics

case documentは少なくとも次を保存する。

- coronary topology / equation version
- release parameter hash
- territory / layer / dominance binding
- current volume / tone checkpoint
- lesion geometry semantics（areaかdiameterか）
- demand owner ID
- FFR/CFR protocol version

旧 noncoronary caseへ silent migrationしない。coronary V1を追加した新releaseとして明示的にinstantiateする。

## 19. parameter identifiability

### 19.1 rest mean flowだけでは識別できないもの

一つの rest mean flowは、少なくとも以下の組合せに同じように反応する。

- territory mass / target flow
- microvascular base resistance
- current tone
- focal lesion linear loss
- Ao pressure / CS pressure
- IMP gain

したがって rest flow一つでこれらを同時 fitしない。

### 19.2 rest + hyperemiaで増える情報

- rest flow + hyperemic flow：rest tone と maximum-dilation resistanceを部分的に分離
- hyperemic distal pressure：epicardial loss と microvascular lossを部分的に分離
- multiple flow levels：stenosis linear $R$ と quadratic $B$ を分離
- EPI/ENDO flow：depth / IMP と layer conductanceを部分的に分離

それでも lesion geometry $A_s,D_0,L_s$ は相互にconfoundedする。CTA / QCAなど imaging priorなしに三つを自由fitしない。

### 19.3 phasic dataで増える情報

- arterial inflow + CS outflow：compliance と resistanceの分離
- pressure + flow：IMP gain と resistanceの分離
- layer diameter / volume：tube PV shapeの分離
- LV/RV pressure + Land stress：CEP と active componentのablation

mean flowだけで $\gamma$ や complianceをfitすることは禁止する。

### 19.4 autoregulation state

$r_{min},r_{max},\alpha_D,g_{met},g_{myo},\tau$ を一つの steady pressure-flow curveからすべて同定できない。

- steady multiple pressure：range / gain
- rest-to-hyperemia：$r_{min}$
- abrupt pressure / HR / demand change：$\tau$
- pressure clampとflow clampの比較：myogenic / flow-error gain

を必要とする。データがなければ release priorを固定し、uncertainty rangeを表示する。

### 19.5 FFR / CFR discordance

FFR-likeが保たれCFRが低いことはCMDと整合し得るが、モデル内でも low demand、high rest flow、diffuse loss、
pressure shiftで同様の組合せが起き得る。FFR/CFR pairから単一 diagnosisを返さない。

## 20. numerical integration plan

### 20.1 outer Backward Euler transaction

coronary volumeはnoncoronary nodeと同じ outer Backward Euler residualへ入れる。

$$
R_i(V_{n+1})
=V_{i,n+1}-V_{i,n}
-\Delta t\sum_e S_{ie}Q_e(V_{n+1},X_{mech,n+1};r_n)=0.
$$

$S$ は incidence matrixである。同じ candidate chamber volumeを mechanics providerへ渡し、chamber pressure、
Land active stress、pericardial pressureを一貫して読む。古い accepted mechanicsから IMPを作ってはならない。

### 20.2 tone integration

tone targetは accepted aggregateから保持する。hydraulic Backward Euler trial中は直前のaccepted $r_n$ を固定し、
residual / Jacobian評価のたびに更新しない。hydraulic trialがcommitされたaccepted sampleだけからaggregateを更新し、
その後pure tone kernelがexact exponential relaxationで $r_{n+1}$ を作り、次のhydraulic stepで使う。trial失敗時は
volumeもtoneも進めない。この明示的なaccepted-boundary operator splitによりfast hydraulic stateとslow regulation
stateを分離し、Newton trial historyが生理stateへ漏れるのを防ぐ。1/2/4 ms convergence gateでsplit errorを監視する。

### 20.3 Jacobian

analytic / semismooth Jacobianは少なくとも次を含む。

- $\partial P_{tm}/\partial V$
- epicardial / CS linear compliance tangent
- $\partial R(V)/\partial V$
- signed $RQ+BQ|Q|$ の flow derivative
- massless $P_d$ eliminationと $R_Dr^{\alpha_D}$ series loss
- graph incidence
- chamber pressure tangent
- IMP の $dP_{cav}/dV$ と可能なら $\gamma d\sigma_a/dV$

Land active stress tangentが同じ callbackで得られない段階では、その coupling columnを0とみなさず、
full finite-difference shadow / fallbackで比較する。analytic Jacobian採択gateは finite-difference directional
derivativeとの一致と Newton反復数の両方である。

### 20.4 admissibility and line search

- 全 physical volume $V_i>0$
- dependent SV volume $>0$
- tube / resistance / loss evaluationがfinite
- tone bounds内
- residual-decreasing line search
- chamber mechanics trialがadmissible

を同時に満たす stepだけを受理する。失敗時は mechanics、noncoronary、coronary volume、toneをすべてrollbackする。

### 20.5 checkpoint

checkpointには次を含める。

- 25 node volumeとfixed TBV
- existing dynamic root flows / valve opening memory
- 5 wall Land state、SLS state、TriSeg coordinates
- 3 coronary tone state
- tone target / aggregate provenance
- coronary topology version、parameter hash、territory binding
- source time、dt、phase、revision

coronary volumeやtoneを欠いた旧checkpointを同じ schema versionとしてrestoreしない。

### 20.6 timestep and convergence

canonicalは既存 scientific runtimeの $dt=2$ msを起点とし、4/2/1 msで phasic metricとmean metricの
convergenceを確認する。stenosis inertanceをV1で除いたため、冠循環だけを理由にsub-msを必須としない。

minimum gateは次である。

- fixed-TBV error：machine-precision近傍、少なくとも $10^{-8}$ mL orderのprotocol tolerance以下
- node continuity residual：既存 scaled residual gateを満たす
- no post-step TBV projection
- P1 / P2判定：既存 full-state classifierを使用
- 1 msと2 msのmean flow、CFR、FFR-like、diastolic fraction、ENDO/EPIが事前規定差以内
- waveformの重要event順序が一致

## 21. validation matrix

### 21.1 unit / property test

| test | acceptance |
|---|---|
| tube law | $V>0$でfinite、monotone、positive tangent、$P(V_0)=0$、loaded cold pointがdeclared $P_{tm,cold}$と一致 |
| resistance | positive、bounded、collapseで増加、$V\ge V_{h,ref}$でscale 1 / derivative 0、analytic derivative一致 |
| Young–Tsai loss | zero lesionでextra loss 0、$\Delta PQ\ge0$、flow増加でquadratic fraction増加 |
| post-lesion pressure | zero lesionで全flowに対し$P_d=P_{Ao}$、distributed arterial lossは$P_d-P_A$側にのみ現れる |
| collapse / waterfall-like behavior | 独立downstream clampなしで、IMP上昇により$V_M$低下、$R(V_M)$上昇、zero / reverse-flow域への連続遷移を示す |
| tone | bounds不変、held targetに単調収束、dt分割でexact relaxation一致 |
| hyperemia ownership | $h$はaccepted tone targetだけを変え、同じhydraulic evaluationへ直接blendされない |
| dilation-owner factorial | $V>V_{h,ref}$のdistensionだけではresistanceが低下せず、hyperemic gainはtone ownerからのみ生じる |
| incidence | 任意flow vectorで全node volume rate総和0 |
| pressure reference | $P_{th}$ / $P_{peri}$のcommon shiftを二重加算しない |
| FFR gate | restでは unavailable、stable hyperemiaでのみfinite |

### 21.2 isolated coronary bench

prescribed Ao / RA / cavity pressure / active stressを用い、whole-heart coupling前に次を確認する。

1. steady constant pressureで inlet = outlet、volume一定
2. sinusoidal CEPで arterial inflowとvenous outflowにphysiologic phase difference
3. active stress only ablation、CEP only ablation、両方onの差
4. EPIよりENDOでcompressionが強い
5. LV driveよりRV driveでsystolic impedimentが弱い
6. focal stenosisでrestよりhigh-flow pressure lossが強くなる
7. pressure stepでtoneがbounded slow response
8. hyperemia wash-in / recoveryがreversible
9. zero lesionで$P_d=P_{Ao}$かつFFR-likeが1
10. Chilian-derived maximum-dilation scalingのstatic resistance ratioが約4.41になる

このbenchはsign、units、series/parallel allocation、tone bindingを調べるcomponent checkである。static diastolic
pressureから得るabsolute flowや4.41という比を、そのままMBF / CFR release acceptanceに用いない。

### 21.3 closed-loop healthy gate

healthy gateは一点の形状一致ではなく、複数observable envelopeを同時に見る。
以下はstatic prescribed-pressure benchではなく、mechanics、hydraulics、toneを同じtransactionで進め、P1/P2 closureを
通過した**whole-cycle accepted periodic orbit**から算出する。CFRは14節のrest-to-hyperemia protocolの両orbitが
それぞれ収束した場合だけ判定する。

- total coronary flow / CO：おおむね3--7%
- myocardial massがある場合、rest MBF：おおむね0.6--1.2 mL/min/g
- LAD / LCx：明らかな diastolic predominance
- RCA：LADより小さい diastolic predominance
- rest ENDO/EPI：おおむね1.0--1.4
- no lesion hyperemic FFR-like：near 1
- CFR：おおむね2.5--5、ただしprotocol pressure shiftを併記
- storage closure / TBV / P1 gateを満たす
- whole-heart CO、AoP、chamber PVがnoncoronary baselineから説明不能に崩れない

flow target、resistance、compliance、IMP gainを同時に調整してこれらを合わせない。感度のownerを一つずつ確認する。

### 21.4 mechanism-direction gate

| perturbation | 必須方向性 |
|---|---|
| $\gamma\downarrow$ / active stress off | 左冠systolic suppressionが弱くなる |
| CEP depth off | ENDO/EPI差が縮小する |
| HR $\uparrow$ | diastolic time低下、左冠reserve / ENDO perfusion低下方向 |
| LVEDP $\uparrow$ | ENDO perfusion pressure / ENDO-EPI低下方向 |
| RV pressure $\uparrow$ | RCAがよりdiastolic dominant、flow reserve低下方向 |
| RAP / CS pressure $\uparrow$ | total coronary perfusion低下方向 |
| Ao pressure moderate $\downarrow$ | tone dilationでflowを部分維持 |
| Ao pressure below reserve | tone floor到達後にflow低下 |
| focal stenosis severity $\uparrow$ | hyperemic flow、CFR、FFR-likeが単調低下 |
| $r_{min}\uparrow$ (CMD) | CFR低下、focal pressure dropなしではFFR-like比較的保全 |
| compliance $\downarrow$ | phasic storage / arterial-venous phase difference低下 |

方向性に反する場合はparameter searchへ進まず、pressure reference、flow sign、event segmentation、state ownershipを
監査する。

### 21.5 focal stenosis × CMD factorial gate

次の2×2を必須とする。

| epicardial lesion | microvascular reserve | expected pattern |
|---|---|---|
| normal | normal | CFR / FFR-likeとも保全 |
| stenosis | normal | CFR低下 + FFR-like低下 |
| normal | CMD | CFR低下 + FFR-like比較的保全 |
| stenosis | CMD | 両方低下、rest flowも低下し得る |

これが区別できない場合、FFR/CFR featureをclinical-facingに出さない。

### 21.6 whole-heart interaction gate

- AS preset：高い LV pressure / stressと左冠phasic flow変化が同じ candidateから生じる
- PH / RV overload：RCA responseがRV mechanicsに追従する
- tamponade / high pericardial pressure：chamberと冠血管にcommon pressureが一度だけ作用する
- valve disease：forward / net COの違いを冠血流%のdenominatorで正しく扱う
- fixed-TBV：coronary追加時にSV / VC shared pressure offsetでpartitionを再構成するがglobal 5600 mLは不変

### 21.7 numerical / CI lanes

fast laneは毎PRで次だけを行う。

- pure kernel property tests
- isolated 1--2 beat mechanism smoke
- fixed-TBV / rollback / checkpoint test
- no-lesion versus focal lesion / CMD small factorial
- observable / control schema tests

canonical laneはhealthy settling、CFR / FFR protocol、4/2/1 ms、AS / PH interactionを行う。expensive parameter
surfaceや全preset settlingをfast suiteへ入れず、nightly / research artifact laneへ分離する。

## 22. falsification / stop conditions

次のいずれかが起きた場合、parameter fittingを止めて構造を再検討する。

1. CEP + active stressを入れてもLADが恒常的にsystolic dominantである。
2. RCA normalとRV pressure overloadの方向性が同じにならない。
3. stenosisを強くしてもhyperemic pressure lossが増えない。
4. CMDとfocal stenosisがCFR / FFR-like pairで全く同じ応答になる。
5. IMP増加でmicrovascular volumeが増える。
6. coronary inflow / outflow差がperiodic stateでも残る。
7. TBV projectionなしではsettleできない。
8. timestepを半分にするとtone、flow、stenosis metricが質的に変わる。
9. active stress tangentを無視した場合だけNewtonが収束する。
10. parameterを正常域内で少し動かすだけでvolume collapse / solver failureが頻発する。
11. zero lesionでhyperemic FFR-likeが1から大きく外れる。
12. maximum dilationでもhealthy CFR 2.5へ構造的に届かない。
13. toneを固定してvolumeを$V_{h,ref}$より増やすだけで大きなhyperemic flow gainが生じる。
14. loaded literature volumeを根拠なくzero-Ptm $V_0$として使う。

構造再検討の順序は、pressure reference、incidence、PV monotonicity、resistance-volume sign、追加zero-flow clampの
重複有無、IMP source timing、tone cadence、最後にparameter priorである。

## 23. V1 で意図的に除外するもの

- 1D epicardial wave propagation、wave intensity、wave speed
- coronary conduit inertance / Young–Tsai unsteady term
- detailed left main / bifurcation geometry、WSS、FFR-CT CFD
- collateral network、Rentrop grade、coronary steal
- CABG、PCI stent geometry、competitive graft flow
- myocardial bridge / dynamic extrinsic epicardial compression
- vasospasmの独立smooth-muscle dynamics
- aneurysm、Kawasaki disease、dissection、thrombus、embolus
- capillary exchange、edema、no-reflow、interstitial fluid state
- hemoglobin / oxygen content / extraction / lactate
- acute ischemiaからLand contractility低下へのfeedback
- infarct、scar、hibernation、stunningのregional mechanics
- detailed autonomic、NO、adenosine、ATP、endothelin pathway
- coronary lymphatics、Thebesian veins
- respiratory variationを超える intrathoracic imaging artifact

これらを V1 parameterの極端値で擬似的に再現しない。collateral、graft、multipatch、oxygen transportは将来の
topology / state versionを上げる変更である。

## 24. 実装順序

### Phase A: pure coronary kernel

- typed topology / state / units
- linear epicardial / CS PV、intramyocardial tube PV、volume-dependent R、Young–Tsai loss
- 3 tone states
- pure trial / commit / checkpoint
- isolated bench / property tests

**branch status:** massless post-lesion $P_d$、distributed arterial $r^{\alpha_D}$、target-only hyperemia、
$r_{min}=4/45$、loaded / zero-Ptm volume分離、collapse-only $R(V)$を含むkernel targeted testはgreen。
これはhealthy periodic release、CFR / FFR-like protocol、browser adoptionのgreenを意味しない。

### Phase B: whole-heart atomic coupling

- Ao / RA incidenceへ接続
- candidate chamber pressure + Land active stress interface
- common pressure reference audit
- full-TBV initialization
- analytic / FD Jacobian comparison

**branch status:** typed mechanics bridge、generic conservative-companion seam、coronary adapter、one-step atomic
commit / rollback、global TBV ledgerをtargeted testで確認済み。healthy periodic settling、long-run drift、dt convergence、
browser adoptionは未完了として扱う。

#### 2026-07-19 bounded closed-loop snapshot

full Land + SLS、membrane-only TriSeg、common pericardium、fixed global TBVを同時に解く現branchで、
$\Delta t=2$ msの12拍cold-start runを実行した。6000/6000 stepがacceptされ、solver failureは0、global / coronary
local ledgerの最大絶対誤差はそれぞれ$2.73\times10^{-12}$ / $2.12\times10^{-13}$ mLだった。これは保存則と
atomic couplingの数値smokeを支持するが、healthy periodic physiologyをacceptした結果ではない。

12拍目ではmean coronary inlet 101.986 mL/min、mean CS outlet 101.136 mL/min、coronary storage drift
$+0.01416$ mL/beatだった。11拍目から12拍目にもmean inlet $+0.405\%$、outlet $+0.631\%$の変化があり、
周期解には未収束である。さらに次をcanonical化前のP1 acceptance blockerとする。

- LAD / LCx / RCAのmean ENDO/EPI arteriolar flow ratioは0.667 / 0.640 / 1.034であり、左冠のresting
  transmural envelopeを満たしていない。layer-specific vascular capacity / regulationのownerを再検討する。
- CS outletは$-11.998$から$+16.609$ mL/sで、逆流は12拍目にも持続した。単純なlow-resistance signed edgeを
  正常canonicalに採用せず、CS / ostium impedanceとThebesian valve competenceを独立に検証する。
- coronary adapterはouter solverへanalytic sensitivityをまだ返さずfull finite-difference fallbackを使う。
  12拍runは100.872 s、短時間benchmarkは約21.2 ms/stepであり、browser / live transition採用前に
  shared Jacobian / Schur sensitivityを実装する。
- accepted toneはpure kernelとして実装済みだが、このcoupled transaction内ではまだ時間発展させていない。
  hyperemia / recovery、CFR、FFR-like、CMDをdynamic protocolとして検証する。

数値reportと自己完結HTMLはそれぞれ
`data/myocardium/reports/mainwire-five-wall-coronary-twelve-beat-dt2ms-validation-v1.json` と
`data/myocardium/visuals/mainwire-five-wall-coronary-twelve-beat-dt2ms-validation-v1.html` に固定した。HTMLは
外部resourceを持たず、実browser描画時のconsole / page errorが0であることを確認した。

### Phase C: observables and healthy periodic release

- waveform / metric registry
- normal-adult territory and mass binding
- P1 settling / dt convergence
- noncoronary baseline差分artifact

**status:** future acceptance work。未実装observableをcurrent runtime claimに含めない。

### Phase D: protocols and disease envelopes

- hyperemia / recovery
- CFR
- FFR-like
- focal stenosis × CMD factorial
- AS / LVH、PH / RV overload、high LVEDP、tachycardia

**status:** focal diameter loss、three-vessel bracket、diffuse structural microvascular resistance、combined LAD bracketの
quantitative research preset dataは実装済み。ただしhyperemia / recovery、CFR / FFR-like、whole-heart disease envelopeは
future protocol workであり、現時点のkernel parameter smokeをvalidated clinical presetと呼ばない。

### Phase E: Workbench

- graph / metric / controller catalog
- scenario / transition / checkpoint versioning
- pane settings / note reference
- production browser E2E

**status:** future browser integration。scientific runtime / Workbenchへ配線されたとはまだ主張しない。

Phase Aのmean flowが良くても、Phase Bのleft/right phasic mechanics、Phase Dのfactorial識別、Phase Eのprotocol
label gateを通るまでは、canonical coronary releaseと呼ばない。

## 25. acceptance claim

V1 が主張できるのは次までである。

> Three-territory, two-layer, blood-volume-conserving 0D coronary research kernel coupled to same-candidate
> chamber pressure and Land active stress, with collapsible intramyocardial storage, a reduced slow-tone kernel,
> lesion-specific post-lesion pressure sampling, and an atomic whole-heart transaction.

現branchではslow-toneのcoupled time advance、CFR / FFR-like protocol、healthy periodic calibration、browser adoptionを
まだ主張しない。

主張できないのは次である。

> Patient-specific coronary diagnosis, treatment recommendation, ischemia probability, oxygen metabolism,
> invasive FFR equivalence, or spatially resolved coronary anatomy.

## 26. primary literature

### Myocardium–coronary coupling / IMP

- Munneke AG, Lumens J, Arts T, Delhaas T. *A Closed-Loop Modeling Framework for Cardiac-to-Coronary Coupling*. Front Physiol. 2022. [DOI](https://doi.org/10.3389/fphys.2022.830925) · [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8919076/)
- Algranati D, Kassab GS, Lanir Y. *Mechanisms of myocardium-coronary vessel interaction*. Am J Physiol Heart Circ Physiol. 2010. [DOI](https://doi.org/10.1152/ajpheart.00925.2009) · [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC2838558/)
- Rabbany SY, Kresh JY, Noordergraaf A. *Intramyocardial pressure: interaction of myocardial fluid pressure and fiber stress*. Am J Physiol. 1989. [DOI](https://doi.org/10.1152/ajpheart.1989.257.2.H357) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/2764124/)
- Bovendeerd PHM, Borsje P, Arts T, van de Vosse FN. *Dependence of Intramyocardial Pressure and Coronary Flow on Ventricular Loading and Contractility: A Model Study*. Ann Biomed Eng. 2006. [DOI](https://doi.org/10.1007/s10439-006-9189-2) · [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC1705493/)
- Krams R, Sipkema P, Westerhof N. *Varying elastance concept may explain coronary systolic flow impediment*. Am J Physiol. 1989. [DOI](https://doi.org/10.1152/ajpheart.1989.257.5.H1471)

### Compliance / waterfall / microvascular mechanics

- Downey JM, Kirk ES. *Inhibition of coronary blood flow by a vascular waterfall mechanism*. Circ Res. 1975. [DOI](https://doi.org/10.1161/01.RES.36.6.753)
- Burattini R, Sipkema P, van Huis GA, Westerhof N. *Identification of canine coronary resistance and intramyocardial compliance on the basis of the waterfall model*. Ann Biomed Eng. 1985. [DOI](https://doi.org/10.1007/BF02407768) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/4073625/)
- Hiramatsu O, et al. *In vivo observations of the intramural arterioles and venules in beating canine hearts*. J Physiol. 1998. [DOI](https://doi.org/10.1111/j.1469-7793.1998.619bn.x) · [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC2230961/)
- Kozlovsky P, Zaretsky U, Jaffa AJ, Elad D. *General tube law for collapsible thin and thick-wall tubes*. J Biomech. 2014. [DOI](https://doi.org/10.1016/j.jbiomech.2014.04.033)

### Autoregulation and demand

- Chilian WM, Layne SM, Klausner EC, Eastham CL, Marcus ML. *Redistribution of coronary microvascular resistance produced by dipyridamole*. Am J Physiol. 1989. [DOI](https://doi.org/10.1152/ajpheart.1989.256.2.H383) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/2492768/)
- Canty JM Jr. *Coronary pressure-function and steady-state pressure-flow relations during autoregulation in the unanesthetized dog*. Circ Res. 1988. [DOI](https://doi.org/10.1161/01.RES.63.4.821) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/3168181/)
- Cornelissen AJM, Dankelman J, VanBavel E, Spaan JAE. *Balance between myogenic, flow-dependent, and metabolic flow control in coronary arterial tree: a model study*. Am J Physiol Heart Circ Physiol. 2002. [DOI](https://doi.org/10.1152/ajpheart.00491.2001) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/12003832/)
- Dankelman J, Stassen HG, Spaan JA. *System analysis of the dynamic response of the coronary circulation to a sudden change in heart rate*. Med Biol Eng Comput. 1990. [DOI](https://doi.org/10.1007/BF02441769) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/2376989/)
- Kuo L, Davis MJ, Chilian WM. *Myogenic activity in isolated subepicardial and subendocardial coronary arterioles*. Am J Physiol. 1988. [DOI](https://doi.org/10.1152/ajpheart.1988.255.6.H1558)
- Suga H, Yasumura Y, Nozawa T, et al. *Prospective prediction of O2 consumption from pressure-volume area in dog hearts*. Am J Physiol. 1987. [DOI](https://doi.org/10.1152/ajpheart.1987.252.6.H1258) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/3591971/)

### Phasic and transmural human / animal measurements

- Ofili EO, Labovitz AJ, Kern MJ. *Coronary flow velocity dynamics in normal and diseased arteries*. Am J Cardiol. 1993. [DOI](https://doi.org/10.1016/0002-9149(93)90128-Y) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/8488773/)
- Marcus JT, et al. *Flow profiles in the left anterior descending and the right coronary artery assessed by MR velocity quantification*. Int J Card Imaging. 1999. [PubMed](https://pubmed.ncbi.nlm.nih.gov/10433289/)
- Danad I, et al. *Feasibility of subendocardial and subepicardial myocardial perfusion measurements in healthy normals with 15O-labeled water and positron emission tomography*. J Nucl Cardiol. 2011. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3143328/)
- George RT, et al. *Patterns of myocardial perfusion in humans evaluated with contrast-enhanced 320 multidetector computed tomography*. J Cardiovasc Comput Tomogr. 2011. [PubMed](https://pubmed.ncbi.nlm.nih.gov/22143171/)
- Chareonthaitawee P, et al. *Global myocardial blood flow and global flow reserve measurements by MRI and PET are comparable*. J Magn Reson Imaging. 2001. [PubMed](https://pubmed.ncbi.nlm.nih.gov/11241807/)
- Manabe O, Naya M, Aikawa T, et al. *PET/CT scanning with 3D acquisition is feasible for quantifying myocardial blood flow when diagnosing coronary artery disease*. EJNMMI Res. 2017. [DOI](https://doi.org/10.1186/s13550-017-0296-x) · [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5459776/) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/28585219/)
- Zheng XZ, Yang B, Wu J. *Sex-specific assessment of reduced coronary sinus flow in non-hypertensive patients with coronary artery disease at rest*. Libyan J Med. 2013. [DOI](https://doi.org/10.3402/ljm.v8i0.21553) · [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3714674/) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/23863220/)

### Coronary blood-volume construction

- Jayaweera AR, Wei K, Coggins M, et al. *Role of capillaries in determining CBF reserve: new insights using myocardial contrast echocardiography*. Am J Physiol Heart Circ Physiol. 1999. [DOI](https://doi.org/10.1152/ajpheart.1999.277.6.H2363)
- Wei K, Jayaweera AR, Firoozan S, et al. *Basis for detection of stenosis using venous administration of microbubbles during myocardial contrast echocardiography: bolus or continuous infusion?* J Am Coll Cardiol. 1998. [DOI](https://doi.org/10.1016/S0735-1097(98)00212-5)
- Indermühle A, Vogel R, Meier P, Zbinden R, Seiler C. *Myocardial blood volume and coronary resistance during and after coronary angioplasty*. Am J Physiol Heart Circ Physiol. 2011. [DOI](https://doi.org/10.1152/ajpheart.01022.2010) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/21217067/)
- Młynarska A, Młynarski R. *Possibility to measure the volume of coronary sinus in contrast-enhanced computed tomography*. Pol J Radiol. 2024. [DOI](https://doi.org/10.5114/pjr/191535)
- Mehra L, Raheja S, Agarwal S, et al. *Anatomical Consideration and Potential Complications of Coronary Sinus Catheterisation*. J Clin Diagn Res. 2016. [DOI](https://doi.org/10.7860/JCDR/2016/16455.7295) · [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4800504/)

### Stenosis / CFR / FFR

- Young DF, Tsai FY. *Flow characteristics in models of arterial stenoses—I. Steady flow*. J Biomech. 1973. [DOI](https://doi.org/10.1016/0021-9290(73)90099-7) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/4732939/)
- Young DF, Tsai FY. *Flow characteristics in models of arterial stenoses—II. Unsteady flow*. J Biomech. 1973. [DOI](https://doi.org/10.1016/0021-9290(73)90012-2)
- Gould KL, Lipscomb K, Hamilton GW. *Physiologic basis for assessing critical coronary stenosis*. Am J Cardiol. 1974. [DOI](https://doi.org/10.1016/0002-9149(74)90743-7) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/4808557/)
- Gould KL, Lipscomb K. *Effects of coronary stenoses on coronary flow reserve and resistance*. Am J Cardiol. 1974. [DOI](https://doi.org/10.1016/0002-9149(74)90092-7)
- Pijls NHJ, et al. *Fractional flow reserve. A useful index to evaluate the influence of an epicardial coronary stenosis on myocardial blood flow*. Circulation. 1995. [DOI](https://doi.org/10.1161/01.CIR.92.11.3183) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/7586302/)
- Pijls NHJ, et al. *Measurement of fractional flow reserve to assess the functional severity of coronary-artery stenoses*. N Engl J Med. 1996. [DOI](https://doi.org/10.1056/NEJM199606273342604) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/8637515/)
- De Bruyne B, et al. *Simultaneous coronary pressure and flow velocity measurements in humans*. Circulation. 1996. [DOI](https://doi.org/10.1161/01.CIR.94.8.1842) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/8873658/)

## 27. 2026-07-19 phasic-flow review と V2 superseding amendment

本節はV1のparameter追試ではない。実装済みV1を反証対象として、入口、組織灌流、静脈還流を別の
observableとして再評価し、次のtopology versionを規定する。旧V1 report / HTMLは比較artifactとして保持し、
同じcheckpoint / report schemaをV2へ流用しない。

### 27.1 現V1波形のevent-based再判定

固定phase windowおよびAoV-open intervalを「収縮期」とみなす定義を廃止する。canonical systoleは、順行MV flowの
閉鎖eventから順行AoV flowの閉鎖eventまでとする。AoV openingからAoV closureまでは別のejection intervalとして
保持する。12拍目ではMVC / AoVO / AoVCがphase 0.950 / 0.054 / 0.248、収縮期長は0.298 sだった。

このevent定義で得た12拍目の結果は次の通りである。これはまだP1ではなく、bounded cold-startのterminal beatである。

| site | LAD | LCx | RCA |
|---|---:|---:|---:|
| inlet diastolic forward-volume fraction | 0.526 | 0.531 | 0.570 |
| inlet peak diastolic / peak systolic flow | 0.563 | 0.567 | 0.597 |
| EPI tissue-inflow diastolic fraction | 0.838 | 0.834 | 0.828 |
| ENDO tissue-inflow diastolic fraction | 0.837 | 0.836 | 0.839 |
| EPI peak delay after AoVC | 0.460 s | 0.434 s | 0.398 s |
| ENDO peak delay after AoVC | 0.624 s | 0.624 s | 0.452 s |

したがって現V1は、「収縮期の冠入口流がない」のではない。入口はAo圧上昇と同時に最大となり、左冠でも収縮期
forward volumeが約47%を占める。一方、組織流入は拡張期優位だがpeakが著しく遅い。正常に期待する
「有限の収縮期forward shoulder + early-diastolic dominant peak」ではなく、入口storage充填と組織bed再充填が
異常に位相分離している。

V1の数理的な主因は次である。

1. $Q_{Ao,k}=\sum_l Q_{1,kl}+\dot V_{A,k}$ であり、MVC--AoVCで積分した収縮期入口forward量の約62--70%が
   正味でterminal arterial
   storageへ入る。全territoryで$R_{dist}C_A\simeq0.42$ sとなるため、共通Ao upstrokeがterritory差を覆う。
2. 単一IM complianceの上流にmicrovascular resistanceの大半を置き、zero-Ptm近傍で
   $R_{art}C_{IM}\simeq2.52$ sとなる。collapse-dependent resistanceも同じnode volumeから増えるため、
   収縮後の再充填がlate diastoleまで遅れる。
3. CS--RAは$R_{CS}C_{CS}\simeq0.0218$ sの対称signed edgeで、RA a-waveをほぼ直接伝える。12拍目は
   reverse duration 0.488 s、forward / reverse volume 2.879 / 1.193 mL/beatであり、正常の短い逆流波とは
   みなしにくい。
4. accepted toneはcoupled transactionで進んでおらず、territory単位1 stateなので、現状のENDO/EPIを
   autoregulationで説明してはならない。

### 27.2 比較すべき実測波形

測定siteを混ぜない。proximal epicardial inlet、distal arteriole、venule、coronary venous reservoir / sinusは別々の
acceptance targetを持つ。

- 健常者MR volume-flowではLADのsystolic peak / meanは0.94 / 0.30 mL/s、diastolic peak / meanは
  2.42 / 1.38 mL/sであり、収縮期flowは有限だが拡張期優位である。同じ研究のRCAはsystolic / diastolic
  peak 1.96 / 1.80 mL/s、mean 0.74 / 0.83 mL/sで、左冠より均一だった
  ([Marcus et al. 1999](https://pubmed.ncbi.nlm.nih.gov/10433289/))。
- より大きい臨床wire cohortではmean diastolic / systolic velocity ratioがLCA 1.85+/-0.70、RCA
  1.53+/-0.34で、RCAも多くは拡張期優位だった。RCAを必ず1.0以下へ固定しない
  ([Seligman et al. 2022](https://pubmed.ncbi.nlm.nih.gov/34338643/))。
- 文献横断したCircAdapt冠循環modelの比較値はLAD / LCx peak D/Sをおよそ2.0--2.3 / 1.8、
  diastolic-to-total velocity integralをおよそ0.8 / 0.7--0.8、RCAをpeak D/S 1.0--1.4、integral
  0.6--0.7としている。ただしvelocityとvolume flowは同一ではなく、直径変化が大きいsiteでは直接置換しない
  ([Munneke et al. 2022](https://doi.org/10.3389/fphys.2022.830925))。
- intramyocardial arteriolar flowは拡張期優位、subendocardialではearly-systolic reverseを許す一方、
  venular flowは収縮期優位となり得る。したがって単一IM flowを「tissue perfusion」と「venous extrusion」の
  両方へ使わない。
- coronary venous flowは収縮期・拡張期の二つのantegrade waveと短いretrograde componentを許す。
  正常で長時間・大容量の逆流を作ることはacceptance targetではない
  ([Ramos Filho et al. 2002](https://pubmed.ncbi.nlm.nih.gov/12219183/))。

### 27.3 採択する最小V2 topology

3 territory x 2 transmural layerは維持し、各layerをarteriolar側とdistal capillary/venular側の2つの
compliant compartmentへ分ける。

```text
Ao -> Art_k -> IM1_k,l -> IM2_k,l -> CV -> RA
              R1          Rm          R2
```

ここでCVは冠静脈全体を縮約したreservoirであり、解剖学的coronary sinus単独のvolumeとは呼ばない。
各layerの式は

$$
P_{1,kl}=P_{IM,kl}^{(1)}+f_1(V_{1,kl}),\qquad
P_{2,kl}=P_{IM,kl}^{(2)}+f_2(V_{2,kl}),
$$

$$
Q_{1,kl}=\frac{P_{A,k}-P_{1,kl}}{R_{1,kl}(V_1,r,s_{CMD})},\qquad
Q_{m,kl}=\frac{P_{1,kl}-P_{2,kl}}{R_{m,kl}(V_1,V_2,r,s_{CMD})},
$$

$$
Q_{2,kl}=\frac{P_{2,kl}-P_{CV}}{R_{2,kl}(V_2)},
$$

$$
\dot V_{1,kl}=Q_{1,kl}-Q_{m,kl},\qquad
\dot V_{2,kl}=Q_{m,kl}-Q_{2,kl}.
$$

全flowはsignedのままとし、正常波形を作るためのhard diodeは入れない。$Q_1$をarteriolar inflow、$Q_2$を
venular extrusionと定義する。$Q_m$は二つのlumped reservoir間のinternal transfer coordinateであり、周期積分は
layer perfusionに等しいが、その瞬時波形を直接測定されるtissue-perfusion waveformとは呼ばない。これにより収縮期の
入口forward flowを残しつつ、arteriolar inflowと収縮期venous emptyingを別々に拘束できる。Munnekeらも各layerに
$C_1-R_m-C_2$を置き、IMPを両complianceへ作用させている。

$f_i$ は自由なshape functionにしない。全compliant nodeで、既存のcollapsible-tube family

$$
x=\frac{V}{V_0},\qquad
P_{tm}=f(V)=P_0\left(x^m-x^{-n}\right),\qquad m>0,\ n>1
$$

を使い、reference complianceから

$$
C_{ref}=\left.\left(\frac{dP_{tm}}{dV}\right)^{-1}\right|_{V_0}
=\frac{V_0}{P_0(m+n)},\qquad
P_0=\frac{V_0}{C_{ref}(m+n)}
$$

と一意にscaleする。相対passive energyは

$$
\Psi(V)=P_0V_0\left[
\frac{x^{m+1}-1}{m+1}+\frac{x^{1-n}-1}{n-1}
\right]
$$

で、$dP_{tm}/dV>0$、$V\to0$と$V\to\infty$でcoerciveになる。初期値は任意のvolume resetではなく、
目標$P_{tm}$をこの単調lawで反転して作る。Art、$C_1$、$C_2$、CVの全volume stateに
$(V_0,C_{ref},m,n)$ ownerを要求し、complianceが未定義のstateをsolverへ渡さない。

collapse-dependent resistanceも自由関数にせず、既存のC1 smoothstep hydraulic-area law

$$
a(x)=a_{min}+(1-a_{min})\,s(\min(1,\max(0,x))),\qquad
s(x)=x^2(3-2x)
$$

から、$\phi_1=a(V_1)^{-2}$、$\phi_2=a(V_2)^{-2}$、中央$R_m$は対称な
$\phi_m=[a(V_1)a(V_2)]^{-1}$とする。これらはstrictly positiveかつboundedで、distensionを第二の
hyperemic gainにしない。dynamic myogenic / metabolic toneはprecapillary $R_1$をownerとし、structural CMDは
$R_1$と$R_m$に別々の固定倍率を持つ。vasodilatory dysfunctionは$R_1$ toneの下限を上げる。

volume stateは16、layer toneを採用した場合のtone stateは6、edgeは22である。1D conduit tree、inertance、
wave reflectionはこのtopologyでD/S integral、early-diastolic peak、venous phaseを説明できない場合のみ次versionで
検討する。0Dで説明できるgross morphologyへ先にinertanceを加え、ringingや多峰性をfitしない。

### 27.4 volume / compliance priorの再構築

V1の「whole coronary volume 12 mL/100 gからIM 4 mL/100 gとCS 3.71 mLを引き、残りを全てterminal
arterial storageへ置く」constructionは廃止する。豚cast morphometryではtotal 12.2 mL/100 gのうちlarge arterial
3.5、capillary 3.8、large venous 4.9 mL/100 gであり、microcirculationは約4.3 mL/100 g、その89.4%が
capillaryだった ([Kassab et al. 1994](https://pubmed.ncbi.nlm.nih.gov/7810711/))。これはcross-species priorであり、
human point estimateではないが、V1の残余全量をarterial complianceへ割り当てる根拠にはならない。

reference volumeとcomplianceは別のownerにする。

文献値を各territory / layerへ配る際は、100 g値を6 compartmentへそのまま複製しない。five-wallのwall mass
$M_w$ と、解剖priorとして固定したwall→territory allocation $w_{kw}$、layer mass fraction $\eta_l$ から

$$
M_{kl}=\eta_l\sum_w w_{kw}M_w,\qquad
\sum_k w_{kw}=1,\qquad \sum_l\eta_l=1
$$

を作り、これを唯一のmass ownerとして、

$$
V_{i,kl}^{ref}=V_i^{(100g)}\frac{M_{kl}}{100\,\mathrm g},\qquad
C_{i,kl}=C_i^{(100g)}\frac{M_{kl}}{100\,\mathrm g},
$$

$$
\sum_{k,l}M_{kl}=M_{myo},\qquad
\sum_{k,l}(V_{1,kl}^{ref}+V_{2,kl}^{ref})
=(V_1^{(100g)}+V_2^{(100g)})\frac{M_{myo}}{100\,\mathrm g}
$$

をconstruction ledgerで検証する。$w_{kw}$ はtarget flow fractionとは別のpriorにし、flow calibrationや病態変更が
anatomical volumeを変えないようにする。EPI/ENDO shareは初期には同じterritory内の質量半分ずつを使い、flow splitや
波形へ合わせてvolume/complianceを再配分しない。将来multipatchが導入された場合は、このallocation matrixを
patch-resolved perfused mass ownerで置換する。

なおKassab 1994の12.2 mL/100 gと各volume分類の分母はporcine **LV mass** であり、全心筋massではない。
初期V2でLV以外へ同じvascular-volume densityを使う場合はcross-wall extrapolationであり、human point estimateとは
扱わない。absolute volume scaleは感度解析対象とし、同論文の排他的size-class fraction（large artery 27.4%、
microcirculation 35.5%、large vein 37.1%）をtopology partitionのprimary structural priorとする。

- anatomical reference volume: $V_{1,ref}+V_{2,ref}\simeq4.3$ mL/100 gを弱いmicrovascular priorとし、
  初期split 50:50はidentifiability regularizationとしてのみ使う。35:65--65:35をsensitivity範囲にする。
- effective dynamic compliance: isolated canine septumのtwo-compartment identificationを弱いpriorとして、
  $C_1=0.01$--$0.03$、$C_2=0.15$--$0.50$ mL/mmHg/100 g、$C_2/C_1=10$--30を探索範囲とする
  ([Spaan et al. 2000](https://doi.org/10.1152/ajpheart.2000.278.2.H383))。
- direct geometric capillary compliance: porcine capillary distensibilityから約0.0175 mL/mmHg/100 gと推定される。
  これはnetwork-levelの$C_2\simeq0.3$と同じ意味ではない。一方をnonlinear PVのlocal slopeとして使う場合、
  他方を独立linear complianceとして加えてstorageを二重計上しない
  ([Kassab et al. 1999](https://doi.org/10.1152/ajpheart.1999.277.6.H2158))。

resting resistanceのlarge arterial : microvascular : large venousは実測pressure partitionに近い
25--28 : 65--68 : 7を初期ledgerとする。microvascular内部の$R_1:R_m:R_2=60:30:10$は直接同定値ではなく、
計算priorとして明記しablationする。active tone、structural CMD、$R_2$を同じ倍率で機械的に連動させない。

### 27.5 IMP mechanismの扱い

現行CEP + Land fiber-stress mappingは、CEP + varying-elastanceを用いた文献構造と近いため、two-compartment化の
初手では保持する。ただし同じdepth-independent active-stress offsetがEPIとRCAを過度に圧迫していないか、
次のmechanismを同じboundary / periodic stateで比較する。

1. CEP only
2. CEP + Land fiber stress
3. CEP + shortening-induced term

Land stressとshortening-induced pressureを無条件に加算すると同じ収縮効果を二重計上し得るため、同時採用を
defaultにしない。$P_{IM}^{(1)}$と$P_{IM}^{(2)}$のcoupling係数は別に持てるが、波形fit用の自由なphase functionは
禁止する。contractility変更とcavity-pressure変更を独立に行うmechanism-direction testで識別する。

### 27.6 acceptance envelope

正常baselineは単一形状ではなく、測定法・site・個体差を含むenvelopeで判定する。

| observable | provisional healthy gate |
|---|---|
| modeled ventricular-wall coronary flow | primary: 0.7--1.3 mL/min/g、target 1.0; secondary: COの約2--7% |
| LAD / LCx inlet D/T forward integral | 0.70--0.85 |
| LAD / LCx peak D/S | peak velocity、volume flow、mean-phase flowを分離し、full mechanical systole (MVC--AoVC) とejection (AoVO--AoVC)を併記する。matched-site peak velocityのnominal 2.2、core soft envelope 1.8--2.8、method / site差を含むbroad envelope 1.5--3.5をcontextにするが、測定契約が一致するまでhard gateにしない |
| LAD / LCx early-diastolic morphology | AoVC後peak時刻、最初200 msのforward volume share、flow-time centroidを併記する。70--140 msはproximal LADの参考域で、$Q_m$へ直接移植しない |
| RCA inlet D/T forward integral | 0.50--0.75; D/Sを必ず1以下へ固定しない |
| left intramyocardial arteriolar flow | early diastolic dominance; ENDOの短いearly-systolic reverseを許容。hidden $Q_m$へ実測peak gateを移植しない |
| venular flow | systolic extrusionを持ち、tissue-flow waveformと同一にしない |
| coronary venous reservoir outflow | systolic + diastolic forward waves; reverseは短い |
| resting ENDO/EPI perfusion | mass-normalized 0.9--1.3を広い初期gateとする |
| periodicity | 全hydraulic volume、tone、mechanicsを含むP1 closureを3拍以上 |
| dt convergence | 2 / 1 msでmean flow、D/T、ENDO/EPI、CFR / FFR-like差2--5%以内 |
| conservation | fixed global TBV、local incidence ledger、全passive edgeの$\Delta P Q\ge0$ |

酸素運搬・消費stateを実装する前はischemiaと表示せず、perfusion reserveまたはsupply-demand proxyと呼ぶ。

peak D/Sの正常域は、測定法を混ぜると見かけ上広がる。angiographically normal coronaryをintracoronary Dopplerで
調べたOfiliらのLAD peak D/Sは2.2±0.5、正常proximal LADをTEE Dopplerで調べたKasprzakらのpeak systolic / diastolic
velocityは31±9 / 67±19 cm/sで、群平均同士の比は約2.16だった
([Ofili et al. 1995](https://pubmed.ncbi.nlm.nih.gov/7611121/),
[Kasprzak et al. 2000](https://pubmed.ncbi.nlm.nih.gov/10978972/))。健康成人8名のphase-contrast MRIではLAD peak
volume flowが0.94±0.28 / 2.42±0.56 mL/s、報告されたpeak S/Dは0.37±0.12で、群平均flowのD/Sは約2.57だった
([Marcus et al. 1999](https://pubmed.ncbi.nlm.nih.gov/10433289/))。これらはvelocityとvolume flow、proximal / mid LAD、
temporal averagingが異なるため同一分布ではない。従って2.2を単一のfit targetにせず、上記のsoft envelopeと
measurement contractを併記する。

### 27.7 実装順序と現在地

1. MVC--AoVC event、AoV ejection、入口 / $Q_1$ / $Q_m$ / $Q_2$ / CVを別metricとして実装する。
2. V1 solverの`3*i` / `5*i`固定offsetをgraph incidenceへ置換し、V1結果の不変性をtestする。
3. topology / checkpoint / reportをV2へ上げ、16 volume / 22 edgeを導入する。V1 artifactは反証比較に残す。
4. volume budgetだけを再配分するablationと、two-compartment化を分離する。
5. mass-constrained initializerでAo / RA / IMPに整合するdiastolic pressure ladderを作る。各volumeを独立resetして
   fixed-TBV ledgerを破らない。
6. fixed-toneではhydraulic morphologyの反証だけを行い、healthy採択はしない。6 layer-toneをaccepted stateとして
   導入し、focal stenosis、structural CMD、vasodilatory dysfunctionを別ownerにする。
7. layer-toneを含むP1 closure後にperiodic / dt / total-flow / phasic morphologyを再gateする。
8. CV / ostial reverseがなお長い場合のみsmooth asymmetric resistanceを検討する。hard diodeは使わない。

現在、1のevent diagnosticsと入口storage decomposition、2のgraph-incidence continuity refactor、3の
V2 topology / checkpoint / literature-prior、およびpressure-ladder initializerと16-state backward-Euler hydraulic
solverまで実装した。V2 solverは16 volume、22 signed passive edge、6 layer-tone ownerを持ち、trial中にはtoneを更新せず、
accepted cycle aggregateからのみ遅いstateを進める。全nodeのPV lawは単調かつcoerciveで、各passive edgeは
$\Delta P Q\ge0$、incidence ledgerはmachine precisionで閉じる。

anatomical cold construction seedとruntime hydraulic checkpointは別schemaに分けた。runtime checkpointはtopology IDだけで
なく、全priorとcollapse-hydraulicsのcanonical fingerprintを持ち、compliance / resistance ablation間の誤restoreを拒否する。
transaction内ではcollapse priorのtrial別差し替えを禁止する。ただしtone更新とmain-wire mechanics / non-coronary volumeを
一つのglobal accepted transactionへ統合する作業は未完であり、browser / closed-loop統合前のblockerとして残る。

ただし現reportはmain-wire terminal beatのAo / RA / IMPをreplayする一方向shadowであり、source側fixed-TBVへatomicに
coupleしていない。この意味で`simulationReady=false`は維持する。以下の結果をclosed-loop canonical baselineやP1 releaseと
呼ばない。

12拍目のV1はnet CO 5.52 L/minに対して冠入口102.0 mL/min、すなわち1.85%で、参照心筋質量あたり
0.697 mL/min/gだった。保存則smokeとしては有効だが、流量baseline、左冠入口D/S、early-diastolic tissue
morphology、CV reverseの複数gateを同時に満たさないためcanonical physiologyとしては棄却する。V2のparameterを
入口波形だけへfitしてreleaseしてはならない。

### 27.8 accepted six-layer autoregulation

V2の正常rest controllerは、各territory x layerのprecapillary $R_1$だけを所有する。accepted windowの平均$Q_m$を
$\bar Q_{kl}$、mass / territory priorから決める需要targetを$Q^*_{kl}$、Art--CV平均圧を$\bar\Pi_k$、tone倍率を$r_{kl}$
とすると、hyperemiaを与えない内因性branchは

$$
\frac{d\log r_{kl}}{dt}
=\frac{g_Q}{\tau_r}
\log\left(\frac{\bar Q_{kl}}{Q^*_{kl}}\right),
$$

$$
r_{min}\le r_{kl}\le r_{max}
$$

とする。$\bar Q<Q^*$なら$r$が低下し、flow errorが残る限りreserveを追加動員する。これはorgan-levelの縮約controllerで
あり、flow自体が生体のsensorだと主張しない。分子mediatorやoxygen debtを明示しない段階では、metabolic
homeostasis surrogateと呼ぶ。

初期priorは$r_{min}=4/45$、$r_{max}=2$、$g_Q=1$とした。$\bar\Pi_k$はaccepted diagnosticとして保持し、
低灌流圧でtone floorへ到達してautoregulation plateauが終わることの判定に使うが、interior equilibriumへpressure biasを
加えない。$g_P\log(\bar\Pi/\Pi_{ref})$を同じintegratorへ加えると、平衡点が
$\bar Q/Q^*=(\bar\Pi/\Pi_{ref})^{-g_P/g_Q}$へずれ、需要homeostasisと矛盾するためである。独立したmyogenic
feed-forwardを再導入する場合は、別state / ownerとtransient protocolを先に定義する。

Chilianらの抵抗45から4への変化は最大拡張reserveのorder priorであり、正常波形へのfit値ではない
([Chilian et al. 1989](https://pubmed.ncbi.nlm.nih.gov/2492768/))。Dankelmanらの急な灌流条件変更に対する
metabolic adaptation half-time 14.4--22.2 sから、live stateの時定数を$\tau_r=25$ sとした
([Dankelman et al. 1989](https://pubmed.ncbi.nlm.nih.gov/2778731/))。shadowのsteady fixed-point探索では1 cycleを
5 s相当として進めたため、toneの最終固定点は評価できるが、260 iterationの軌跡を実時間1300 sの生理応答とは解釈しない。

### 27.9 V2 terminal-boundary shadowの結果

同じmain-wire terminal beatを500 sample / cycle、$dt=2$ msでreplayした。全edgeの最小散逸powerは
$4.46\times10^{-14}$ mmHg mL/s以上、最大volume-ledger残差は$8.15\times10^{-10}$ mL、最終beatの最大相対volume driftは
$3.61\times10^{-6}$、最大log-tone changeは$4.36\times10^{-5}$だった。事前に宣言したshadow gate
($10^{-5}$ / $10^{-4}$)を満たすが、source feedbackを含むclosed-loop P1ではない。以下の不一致は質量漏れやactive
resistanceで作ったartifactではない。

対称$R_1:R_m:R_2=60:30:10$、accepted layer-toneの代表値は次である。mean flowとENDO/EPIはcontrollerの
target closureであり、独立したvalidation evidenceではない。

| observable | V2 shadow | 判定 |
|---|---:|---|
| total inlet flow | 0.9999 mL/min/g | controller targetへ収束。validation量ではない |
| LAD inlet D/T forward integral | 0.850 | 上限境界、V1 0.526から大幅改善 |
| LAD peak D/S | MVC--AoVC: 1.111; AoVO--AoVC: 4.628 | protocolだけで判定方向が反転。現時点はcontext metric |
| LAD diastolic / systolic mean net flow | 2.738 | peakよりrobustな補助量として保持 |
| LAD inlet peak after AoVC | 146 ms | proximal参考域の近傍。単独rejectしない |
| LAD systolic forward / reverse volume | 0.156 / 0.0186 mL | forwardは有限。入口reverseは78 ms続く |
| LAD ENDO/EPI $Q_m$ | 1.110 | controller target closure。validation量ではない |
| LAD EPI / ENDO $R_1$ tone scale | 0.672 / 0.118 | ENDOが最大拡張floor 0.089に近く、健康rest reserveとして不合格 |
| LAD ENDO $Q_1$ / $Q_m$ peak after AoVC | 56 / 574 ms | $Q_1$はearly、$Q_m$はlate。$Q_m$のearly-200 ms shareは0.072 |
| CV--RA / LAD ENDO $Q_2$ reverse | 0 / 0.00685 mL | outlet逆流はないが、$Q_2$ backfillは0.260 s続く |

この結果は、$C_1-R_m-C_2$分割によって「左冠入口は拡張期優位だが収縮期にも流れる」という積分量と、arteriolar
inflow / internal reservoir transfer / venular extrusion / common venous flowの位相分離を表現できることを示す。一方、正常ENDO flowを
保つためにほぼ全拡張reserveを消費し、$Q_m$時刻と内部venous backfillを外す。peak D/Sはprotocol未整合なので
単独の採否根拠から外す。従ってtopologyの表現力は採択するが、
このoperating pointを健康canonical parameterとしては棄却する。

### 27.10 resistance partition x proximal complianceの2 x 2反証

波形を見ながら連続parameterを探索せず、二つの独立したmechanismをfactorialに変更した。

- resistance partition: 両layer 60:30:10 versus ENDOだけ70:15:15。後者は
  Chilianらのarteriolar / capillary / venular pressure-drop方向を用いた**方向性ablation**であり、同論文から直接同定した
  正確な三分率ではない ([Chilian et al. 1991](https://pubmed.ncbi.nlm.nih.gov/1873859/))。
- proximal Art compliance: literature-priorの1.0 versus local slopeだけ0.4倍。reference structural volumeと圧は変えない。

| microvascular partition | Art $C$ | LAD D/T | peak D/S full / ejection | peak delay | systolic reverse | ENDO tone |
|---|---:|---:|---:|---:|---:|---:|
| symmetric 60:30:10 | 1.0 | 0.850 | 1.111 / 4.628 | 146 ms | 0.0186 mL | 0.118 |
| directional ENDO 70:15:15 | 1.0 | 0.819 | 1.084 / 1.790 | 532 ms | 0 | 0.471 |
| symmetric 60:30:10 | 0.4 | 0.863 | 1.217 / 4.650 | 128 ms | 0.0489 mL | 0.114 |
| directional ENDO 70:15:15 | 0.4 | 0.857 | 1.119 / 2.974 | 176 ms | 0.00130 mL | 0.470 |

抵抗配分はENDO reserveと近位逆流を改善するがpeakをlate diastoleへ遅らせる。Art compliance低下はpeak時刻を早めるが、
逆流を増やしD/Tを上げる。併用は入口逆流とreserveの妥協点だが、LAD ENDO $Q_m$ peakは406 ms、最初200 msの
diastolic forward shareは0.075に留まり、LAD ENDO $Q_2$は0.232 s backfillする。入口peak比はphase protocol依存で
hard判定しない。なお本節執筆時点では$Q_m$を実測tissue flowへ近いものとして過剰に拘束していた。28節の監査により、
$Q_m$ timingはdiagnostic fingerprintへ降格する。それでも内部静脈のphaseとparameter reserveは独立に評価する。したがって、
問題を単一complianceまたは抵抗比の局所探索へ帰属させる仮説を棄却する。

### 27.11 文献modelとの差と次の数理変更

Munnekeらの閉ループmodelも各layerに$C_1-R_m-C_2$、両complianceへのIMP、初期60:30:10を置く。一方、healthy
referenceでは、静的85 mmHgだけから抵抗を作って終わらせず、**拍動する基準simulationで目標平均flowを得るよう$R_1$の
reference pressure dropを調整**している。また大冠動脈は1D conduitとして持つ
([Munneke et al. 2022](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2022.830925/full))。

V2は静的pressure partitionでbase resistanceを作った後、IMP、collapse、$C_1/C_2$ storageを追加している。そのため、
拍動負荷で生じる平均flow deficitを正常autoregulationが補い、ENDO $r\simeq0.1$となる。これはcontroller不足というより、
normal operating-point constructionと拍動hydraulicsを別々に較正したことによる意味論上の不整合である。

次versionでは以下の順に進める。

1. 正常拍動boundary、$r=1$、構造volume固定のまま、各layerのbase $R_1$を平均$Q_m=Q^*$となるよう一度だけ解く。
   これは正常reference stateの構築であり、peak形状fitではない。病態simulation中は固定する。
2. そのoperating pointでCEP-only / CEP + Land fiber stressと、collapse multiplierなし / ありをfactorialに比較する。
   IMPとvolume-dependent resistanceが同じ収縮圧迫を二重計上していないか確認する。
3. mean flow、healthy reserve、ENDO/EPIが回復してもpeak D/Sだけが残る場合に限り、近位conduitの最小
   characteristic impedance / wave-transmission stateを導入する。full 1D treeへ直ちに進まず、dt convergence、passivity、
   多峰性 / ringing gateを必須にする。

ただしbase $R_1$の再正規化だけでは、現在の有効抵抗を別parameterへ移すだけになり得る。reserve意味論が回復しても
波形が不変なら、それを成功と判定しない。human LADで正常なearly-diastolic acceleration timeは約95 msであり、
backward suction waveが主要な拡張期accelerating waveであることも報告されている
([Seligman et al. 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9724998/),
[Davies et al. 2006](https://pubmed.ncbi.nlm.nih.gov/16585389/))。0D storage / IMPだけでこの時刻・peak比を説明できないことを
反証した後なら、conduit wave impedanceは形状fittingではなく欠落物理として正当化できる。

### 27.12 現時点の採択判断

- **採択**: 3 territory x 2 layer、$C_1-R_m-C_2$、signed flow、coercive PV、graph incidence、6 accepted tone、
  focal stenosis / structural CMD / dilation floorの責任分離。
- **条件付き採択**: CEP + Land IMP、collapse-dependent resistance、60:30:10。いずれも独立ablationが必要。
- **棄却**: V1 single-IM topology、静的抵抗構築をそのまま健康基準とすること、正常波形を作るhard diode、現V2 shadowを
  healthy canonical releaseと呼ぶこと。
- **保留**: proximal characteristic impedance / inertance / 1D conduit。gross integralを作るためには追加せず、
  operating-point / IMP / collapse反証後にearly-diastolic wave physicsとして判断する。

## 28. 2026-07-19 beating-reference / IMP / collapse / transport 監査

本節は27節を置換する実装判断である。normal beating boundaryを固定したshadow上で、波形を目的関数にせず、各layerの
accepted-cycle mean $Q_m$だけをtargetとしてbase $R_1$を一度だけ構築した。その後はtoneを厳密に1へ固定し、IMP、collapse、
resistance partition、complianceを比較した。従って、以下のD/Tやpeak時刻はconstruction targetではない。

### 28.1 R1 rebaseのexact oracle

現V2ではbase $R_1$とaccepted tone $r$は完全な積で入るため、

$$
R_{1,kl}^{new}=r_{kl}^{*}R_{1,kl}^{old},\qquad r_{kl}^{new}=1
$$

とすれば、同じboundary / volumeに対する全pressure、全22 edge flow、散逸powerは代数的に不変である。実装testでもこの
identityを確認した。したがってR1 rebase単独で波形が変わればbugであり、改善とは判定しない。rebaseの意味は、健康referenceで
`tone=1`を回復し、以後のdisease / hyperemia parameterとconstruction parameterを分離することだけである。

強いcollapse priorで得た旧LAD EPI / ENDO scaleは0.672 / 0.118で、ENDOはdilation floorに近かった。これは健康reserve不足を
示し、normal controllerの成功とはみなさない。

### 28.2 IMPはLandとSIPを加算しない

両complianceへ同じIMPを作用させると、

$$
Q_m=\frac{(P_{IM}+f_1(V_1))-(P_{IM}+f_2(V_2))}{R_m}
=\frac{f_1(V_1)-f_2(V_2)}{R_m}
$$

である。IMPは$Q_1$と$Q_2$を直接変え、$Q_m$にはstorage経由で間接的にだけ作用する。従ってLand active termをSIPへ
置き換えるだけで$Q_m$ peakを任意に早めることはできず、C1/C2へ異なる自由gainを追加して形状fitしてはならない。

mechanism factorialでは `CEP + Land active`、`CEP only`、`CEP + shortening-induced pressure (SIP)`を置換関係で比較した。
Land activeとSIPは同じ収縮をsolid stressとfluid pressureの両方として数える可能性があるため加算しない。この責任分離は
[Algranati et al. 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC2838558/)に沿う。SIPはaccepted MVCのwall fiber log strainを
referenceとし、正のfractional shorteningのsmooth partへterritory weightを掛け、normal peak 15 mmHgを弱いamplitude priorと
した。これは波形peakへのfitではない。

ここで述べたCEP / Land / SIP置換比較とcollapse on/off比較は、現transport compact artifactより前の探索full reportに基づく。
現行の自己完結artifactは全cellをSIP + area floor 0.67に固定したtransport感度だけを保持し、旧mechanism factorial自体は
再現対象に含めない。従ってSIPと0.67はcanonical constitutive lawではなく、atomic closed-loopで再反証すべきprovisional
mechanism priorである。

### 28.3 collapseをstorage volumeから直接caliberへ読み替えない

旧$epsilon_A=0.10$では、LAD ENDO $C_2$の$V/V_h$がbeat中0.185まで低下し、total reservoir volumeの減少を局所断面積の
90% collapseへほぼ直接変換していた。しかしbeating-heart直接観察ではENDO arteriolar / venular diameter低下は概ね
10--18%で、EPI arterioleはほぼ不変だった
([Hiramatsu et al. 1998](https://pmc.ncbi.nlm.nih.gov/articles/PMC2230961/))。lumped reservoir volumeは局所caliberそのものではない。

そこでdiameter floor 0.82に対応するhydraulic-area floor $0.82^2\simeq0.67$をbounded mechanism priorとし、
$R$ multiplier上限を約$1/0.67^2=2.23$へ制限した。これはcollapseを消すのではなく、独立したgeometry evidenceで上限を
拘束する変更である。この条件でLAD EPI / ENDO R1 scaleは約0.81 / 0.64へ戻り、健康referenceのreserve意味論が大きく改善した。

### 28.4 $Q_m$ timing hard gateの撤回

$Q_m$はC1とC2の間のhidden fluxで、個々の毛細血管flowを直接表さない。生体内観察では毛細血管ごとに収縮期優位・拡張期
優位が混在し、arterial-sideからvenous-sideへphasic-flowのwatershedが存在する
([Kiyooka et al. 2005](https://pubmed.ncbi.nlm.nih.gov/15345479/))。従って旧暫定gateの
`Qm peak < 0.30 s`、`first 200 ms share >= 0.25`を生理学的hard gateから外し、diagnostic fingerprintへ降格する。

$Q_m$のhard gateは、周期積分が$Q_1$ / $Q_2$と一致すること、net forward、C1/C2 volume closure、受動散逸、dt収束に限定する。
実測文献と比較する波形はLAD/LCx/RCA inlet、$Q_1$ arteriolar side、$Q_2$ / CV venous side、ENDO/EPI、caliber proxyである。
別protocolとして一定IMP下のperfusion-pressure stepを行い、vascular-volume / refill relaxationが概ね1.5--4 sを覆うか検証する
([Spaan et al. 2000](https://pubmed.ncbi.nlm.nih.gov/10666068/))。

### 28.5 C2 / resistance 2 x 2の数理結果

$C_2=0.30$から0.15 mL/mmHg/100 gへの半減は実験範囲内である
([Kajiya et al. 1986](https://pubmed.ncbi.nlm.nih.gov/3698215/),
[Nagumo et al. 1993](https://pubmed.ncbi.nlm.nih.gov/8252707/))。一方70:15:15は正常値ではなく、$R_m$を半減するablationである。

| partition | $C_2$ scale | LAD inlet forward D/(D+S) | inlet peak after AoVC | ENDO $Q_1$ peak | $Q_m$ early share | $Q_2$ reverse / duration |
|---|---:|---:|---:|---:|---:|---:|
| 60:30:10 | 1.0 | 0.758 | 236 ms | 110 ms | 0.185 | 0.0151 mL / 230 ms |
| 60:30:10 | 0.5 | 0.757 | 244 ms | 116 ms | 0.197 | 0.0410 mL / 288 ms |
| low-$R_m$ 70:15:15 ablation | 1.0 | 0.744 | 260 ms | 124 ms | 0.187 | 0.0122 mL / 226 ms |
| low-$R_m$ 70:15:15 ablation | 0.5 | 0.744 | 266 ms | 130 ms | 0.205 | 0.0315 mL / 290 ms |

C2半減は$Q_m$ fingerprintを少し動かすがQ2 backfillを悪化させる。70:15:15もQ2 reverse量を少し減らすだけで入口を遅らせる。
線形化すると70:15:15は$R_m$を半減する一方、$R_2$を1.5倍にし、2-state slow poleは約0.96から1.37 sへ遅くなる。
速くなるのは差動modeだけであり、`transport-fast`とは呼ばない。両変更ともcanonical normal priorには採択しない。

### 28.6 LAD measurement contractの修正

従来表示した`LAD inlet peak D/S = 1.225`は、拡張期peakをMVC--AoVCの最大forward flowで割っていた。監査すると分母の
最大点はMVC境界そのもので、独立したejection peakではなかった。同じ波形をAoVO--AoVCで区切るとpeak D/ejectionは
1.983、MVC--AoVCのmean-net D/Sは1.594、forward-volume D/(D+S)は0.790である。従って1.225を文献のpeak D/S
2.1--2.6と直接比較して「収縮期flow過多」とした旧解釈は撤回する。

以後、各flow surfaceで少なくとも次を同時に保存する。

| metric | phase / site contract | role |
|---|---|---|
| peak D/full-S | diastole peak / MVC--AoVC peak | pre-ejectionを含むmodel diagnostic。分母がMVC境界かをflagする |
| peak D/ejection | diastole peak / AoVO--AoVC peak | 文献peak比に近い補助量。分母がAoVO / AoVC境界かをflagする |
| mean-net D/S | MVC--AoVCに対するdiastoleのphase mean | recent LPMのmean DSFRと比較する補助量 |
| D/(D+S) forward volume | 正のflowの周期積分 | phasic volume balance。peak形状とは独立 |
| AoVC→forward onset / onset→peak | valve eventと符号から導出 | 収縮期からforward flowが連続する場合、onset=0を臨床ACTと同一視しない |

さらに、単一の「LAD inlet」を測定siteとして扱わない。territoryごとに

$$
Q_{in,k}=Q_{Ao\rightarrow Art,k},\qquad
Q_{out,k}=\sum_l Q_{R1,kl},\qquad
\dot V_{Art,k}=Q_{in,k}-Q_{out,k}
$$

を出力する。$Q_{in}$はsource-side Ao→lumped epicardial/prearterial reservoir、$Q_{out}$は同reservoirから二層R1へ出る
derived flowであり、新しいstateやedgeではない。両者の差はArt volumeのexact storage rateである。proximal / mid / distal
LAD DopplerやMRIへ対応したと主張せず、measurement-site mappingは近位conduitを明示した段階で別にversion管理する。

### 28.7 C1 / proximal pressure-loss placementの事前規定factorial

波形目的関数を使わず、二つの独立した機序だけを2 x 2で比較した。

- $C_1$: 0.015から0.010 mL/mmHg/100 g相当、すなわちscale 1から2/3。Spaanらの宣言済み
  0.01--0.03範囲内で、近位intramyocardial reservoirのfast storage sensitivityを調べる。
- Ao→Art pressure-loss fraction: 25%から10%。静的reference path lossとtarget flowを厳密に保存し、取り除いたlossを各層R1へ
  移す。大冠動脈そのもののlossが小さいという解剖学的方向性のablationであり、新しい自由parameterとして採択しない。

| $C_1$ scale | Ao→Art $\Delta P$ | source D/(D+S) | peak D/full-S | peak D/ejection | mean-net D/S | source / Art-out peak | ENDO $Q_1$ peak |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1.00 | 25% | 0.790 | 1.225 | 1.983 | 1.594 | 210 / 230 ms | 128 ms |
| 0.67 | 25% | 0.778 | 1.180 | 1.878 | 1.489 | 168 / 114 ms | 102 ms |
| 1.00 | 10% | 0.789 | 1.243 | 1.982 | 1.588 | 196 / 230 ms | 154 ms |
| 0.67 | 10% | 0.778 | 1.209 | 1.821 | 1.489 | 158 / 146 ms | 128 ms |

$C_1$ 2/3はmean flow 1.000 mL/min/g、max relative closure $2.42\times10^{-11}$、minimum passive-edge power
$3.40\times10^{-9}$ mmHg mL/sを維持しながら、source、Art-out、ENDO $Q_1$の全てをearly diastoleへ移した。これは
static resistanceやmean targetを変えず、coupled C1--C2 systemのfast storage time scaleを短くする方向であり、波形fitではない。
固定境界のprovisional candidateをこのcellへ更新する。

一方、pressure-lossを10%へ移す変更はsource peakを14--10 ms早めても、Art-out / $Q_1$を一貫して改善しなかった。
現Art nodeはepicardial conduitだけでなくprearterial storageも集約しているため、10%を「より正しいepicardial resistance」と
みなしてcanonical化すると責任範囲を混同する。このablationは棄却し、25% construction ledgerを保持する。将来、解剖から
拘束したepicardial tubeとprearterioleを分離する場合にだけ再導入する。

### 28.8 文献波形との照合と残るclaim boundary

正常LAD peak D/Sは測定法別に、intracoronary Doppler 2.2±0.5、proximal TEE Dopplerの群平均比約2.16、健康MRI
volume-flowの群平均比約2.57である。従ってmatched-site peak velocityのnominal 2.2、core soft envelope 1.8--2.8、
method / site差込み1.5--3.5を採用する。provisional candidateのsource peak D/ejection 1.878はcore envelope下端内だが、
分母はAoVO境界であり、source-side flowなのでmatched clinical validationとは呼ばない。

early-diastolic timingも定義依存である。正常対照のdiastolic-flow onset→peakは105±12 ms、mid-LAD Dopplerのcontrol ACTは
163±29 msだった。一方、LBBBでは134--136 ms、HCMでは237±89 msへ遅延している
([Skalidis et al. 1999](https://doi.org/10.1016/S0735-1097(98)00698-6),
[Kawamura et al. 1999](https://www.jstage.jst.go.jp/article/jcj/63/5/63_5_350/_pdf))。candidateのArt-out 114 msと
ENDO $Q_1$ 102 msはこの文献contextに入るが、source inlet 168 msは遅めである。モデルはAoVC前からforward flowを保持するため、
算出上のforward onsetは0 msであり、臨床Dopplerで再出現するdiastolic episodeのonsetと同一ではない。

2025年のtime-varying-resistance LPMは、IMPだけのmean DSFR 1.70に対し、収縮に伴うresistance変化を加えると2.65、比較した
in-vivo値は1.95と報告した
([Yong et al. 2025](https://doi.org/10.1016/j.jbiomech.2025.112679))。現V2はすでにmechanics-driven IMPと
bounded caliber-dependent resistanceを持つため、この結果だけを根拠に追加のtime-varying gainを重ねると収縮圧迫を二重計上する。
まず同じmeasurement contractでcollapse on/offを再評価する。

単純なconstant inertanceも現段階では追加しない。C1感度だけで下流observableが102--114 msへ移り、多峰性やringingなしに
受動性を保てたためである。atomic closed-loop後もsource / measurement-site flowだけが遅い場合は、geometry、wave speed、
characteristic impedanceを相互拘束したterritoryごと1-cellのpassive proximal tubeを検討する。$L$を独立したshape knobにはしない。

このcandidateは**固定terminal-boundary shadowでの機序選択**であり、healthy canonical releaseではない。atomic main-wire
closed-loopへ接続してfixed TBV / 全state P1 / 2--1 ms refinement / pressure-step / hyperemia reserve / disease-directionを
再確認するまで`simulationReady=false`を維持する。

### 28.9 protocol / artifact integrity

solverへ渡したboundary objectからreport用pressure snapshotを同じstepで生成し、SIPを含む**実際のIMP**を保存する。
pressure、LVFW / SEP / RVFW fiber strain、MVC/AoVO/AoVC definition、そこから解決したSIP boundaryをfingerprintへ含めるため、
圧波形が同一でもshortening sourceやevent definitionが異なるreportを同一protocolとは判定しない。beating-reference reportは
tone closureだけでなく、volume periodicity、incidence ledger、Newton residual、passive-edge power、全6層のmean-Qm target誤差
$\le10^{-3}$、全層がtone上下限ではなくinteriorにあることを通過した場合だけR1 rebaseへ使用できる。

旧比較artifact
`data/myocardium/reports/mainwire-coronary-v2-sip-bounded-transport-factorial-v1.json`はC2 / resistance探索の履歴として残すが、
無修飾D/S解釈は本節のmeasurement contractで置換する。現行artifact
`data/myocardium/reports/mainwire-coronary-v2-lad-measurement-site-factorial-v1.json`は4 cellのterminal 500 samples、source hash、
reference構築拍数・tone law・update window、C1、Ao→Art pressure-loss placement、derived Art-out / storageを保持する。
対応HTMLは`data/myocardium/visuals/mainwire-coronary-v2-lad-measurement-site-factorial-v1.html`である。rendererはcompact
artifactだけで再生成でき、一時的なfull 20-beat / 260-beat reportを必要としない。各rowにはMVC / AoVO / AoVC phaseを、
reproduction metadataには明示的なcandidate rowを保存し、D/S再監査とcandidate選択もcompact artifact単体で再現する。
C1→C2 fluxは`qmInternal`、その周期平均比は
`endocardialToEpicardialMeanQmInternalRatio`と呼び、旧`tissue`名は既存reader用deprecated aliasに限定する。
