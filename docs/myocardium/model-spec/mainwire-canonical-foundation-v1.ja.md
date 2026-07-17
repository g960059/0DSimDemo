# Main-wire canonical foundation V1

## 目的とclaim boundary

このmilestoneは、将来の四腔・TriSeg閉ループの基礎として、次の構成を同じtransactionへ統合する。

- LA/RA: Moyer 2015 equibiaxial受動則の厳密なone-fiber reduction
- LVFW/SEP/RVFW: Klotz normal-center one-fiber受動則
- 5壁すべて: Land 2017のactive-only 6-state kernel
- 5壁すべて: equilibrium passiveと並列の1-state SLS
- 5壁すべて: 外部入力Caを担う2-decay exact-event state
- main-wire由来の非冠循環と、明示的な固定TBV operating-point prior
- 四腔に共通する保存的scalar pericardium

これは `ModelCore` runtimeへの採用を意味しない。PV形状へのparameter fitting、患者別同定、冠循環、局所心膜癒着、収縮性心膜炎、呼吸性心室相互依存、Ca release recovery、SERCA/RyR、restitution、alternansの再現をclaimしない。

## 心房受動構成

心房のunloaded cavity volume、wall material volume、Moyer law、SLS parameterは、`normalAdultAtrialPassiveConstructionV1`が一つのbundleとして所有する。これにより、unloaded geometryだけを変えて別の受動則を暗黙に残すことを防ぐ。

SLSはequilibrium passiveと並列であり、Land active kernelや外部series elementの代替ではない。外部SEEはこのfoundationに含めない。

## event-driven Caと原子性

各壁のCa stateは二つの減衰stateからなる。

$$
\dot r=-\frac{r}{\tau_r},\qquad
\dot d=-\frac{d}{\tau_d},
$$

event時に

$$
r^+=r^-+s,\qquad d^+=d^-+s,
$$

とし、

$$
Ca=C_{rest}+\beta(d-r)
$$

をLand kernelの外部Ca入力とする。event間は指数関数で厳密に進め、off-grid eventでは積分区間を分割する。

circulation、mechanics、5壁Caは同一revision/timeを持ち、全trial成功後だけcommitする。Newtonまたはmechanics trialが失敗した場合、三者すべてを直前accepted stateへrollbackする。pericardiumはpure algebraic evaluationであり、第四のdynamic ownerではない。

## 保存的common pericardium

心膜は四腔を個別にfitする要素ではなく、total occupied volumeだけを見る共通bagとする。

$$
V_h=V_{LA}+V_{LV}+V_{RA}+V_{RV}+\sum_{w=1}^{5}V_{wall,w},
$$

$$
V_{occ}=V_h+V_{fluid}.
$$

`V_fluid`は静的な心膜腔占有量であり、血液量でもdynamic stateでもない。したがってTBVへ加えない。

正部分を単調・凸なC2 transitionで平滑化した$g(x)$を用い、

$$
x=\frac{V_{occ}-V_0}{V_0},
$$

$$
\Psi_{peri}
=\frac{P_sV_0}{k}\left[\exp\left(kg(x)\right)-1-kg(x)\right],
$$

$$
P_{peri}=\frac{\partial\Psi_{peri}}{\partial V_{occ}},
\qquad
K_{peri}=\frac{\partial P_{peri}}{\partial V_{occ}}\ge 0
$$

とする。四腔のcandidate absolute pressureへ同じ$P_{peri}$を一度だけ加える。

$$
P_{cav,abs}=P_{cav,tm}+P_{th}+P_{peri}.
$$

$P_{peri}$をTriSeg内部generalized forceへ直接加えない。四腔volumeに関する接線は

$$
J_{peri}=K_{peri}\mathbf{1}\mathbf{1}^{\mathsf T}
$$

というrank-one構造を持ち、総volumeを変えない腔間redistributionはnullspaceにある。

## 固定normal-adult binding

選択肢は次の固定registryだけである。

- `healthy-slack`（default）
- `effusion-300ml-positive-control`
- `global-capacity-vh0-430ml-positive-control`

healthy referenceは、ED/ESのphase-consistent CMR anchorの大きい方に5壁material volumeを加え、さらに5% reserveを置く。5%は数値的な構造priorであって、正常ヒトの文献値、患者fit、PV-loop fitではない。既定軌道では全sampleがzero branchにあり、$P_{peri}=\Psi_{peri}=K_{peri}=0$を厳密に満たす。

二つのpositive controlは機序確認だけに用いる。300 mL effusionを臨床的なtamponade thresholdと解釈せず、430 mL capacityを収縮性心膜炎の患者parameterと解釈しない。

## protocol/schema境界

pericardium bindingはprotocol component hashの独立componentである。既存V1 identityを再定義せず、canonical runnerは次を返す。

- closed-loop result schema V2
- periodic result/protocol identity schema V2
- pericardium readbackを追加したdiagnostic extension V3

V1 export名は互換aliasとしてのみ残し、実体は明示的なV2 APIとする。既存のcirculation configuration snapshot、TBV prior、Ca representation、event schedule identityは独立componentのまま維持する。

## 固定検証

- $d\Psi/dV=P$、$dP/dV=K\ge0$
- rank-one tangentとredistribution nullspace
- static fluidがTBV/stateへ混入しないこと
- circulation/mechanics/Caのatomic rollback
- healthy-onの全sampleでpericardium readbackが厳密zero
- healthy-onとexact-offのlegacy V2 sample projectionがbyte-identical
- legacy analytic-control coarse trace hash `58a24381`の維持
- global-capacity/effusion fixed controlsのpositive engagement
- pericardium bindingだけを変えたprotocol identity separation

重いperiodic artifact生成とwarm-start/checkpoint APIは次milestoneに分離する。

## 主要文献と内部仕様

- Land et al. 2017, human cardiomyocyte contraction model, DOI `10.1016/j.yjmcc.2017.03.008`: <https://pubmed.ncbi.nlm.nih.gov/28392437/>
- Moyer et al. 2015, human-LA mechanics construction, DOI `10.1007/s10439-015-1256-0`: <https://pmc.ncbi.nlm.nih.gov/articles/PMC4497915/>
- Klotz et al. 2006, normalized EDPVR, DOI `10.1152/ajpheart.01240.2005`: <https://pubmed.ncbi.nlm.nih.gov/16214801/>
- total heart volumeとpericardial fluidを用いるtamponade circulation model: <https://pmc.ncbi.nlm.nih.gov/articles/PMC2736922/>
- prescribed biexponential cytosolic Ca入力と限界: [mainwire-exact-event-prescribed-calcium-v1.ja.md](./mainwire-exact-event-prescribed-calcium-v1.ja.md)
- Moyer reduction、unloaded volume、SLS bundle: [mainwire-normal-adult-atrial-passive-construction-v1.ja.md](./mainwire-normal-adult-atrial-passive-construction-v1.ja.md)
