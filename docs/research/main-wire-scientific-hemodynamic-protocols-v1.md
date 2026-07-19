# Main-wire vascular-function / fixed-TBV operating-locus protocol V1 / V2

## 結論

旧 Guyton / Starling pane の意図は有用だが、同じ sweep を複数の生理学的概念に流用してはいけない。現行 Web app では次の三つを明示的に分離する。

1. 固定血液量・固定血管特性から求める vascular-function curve
2. 2自然拍だけを進めて速く概形を示す、10点の rapid finite-hold TBV preview
3. canonical periodicity gate で分類した P1 / P2 evidence からなる settled fixed-TBV operating locus

TBV だけを変える実験は一自由度なので、結果は CVP–PCWP–CO 空間上の一次元 locus であり、二次元 surface ではない。また、外部ポンプで右房圧と流量を独立操作した Guyton の原実験そのものでもない。各TBV点から ED、ES、stroke work（SW）の観測値は保持するが、点間を ESPVR、EDPVR、PRSW として fit しない。TBV変更では心室固有特性だけでなく、左右心、血管床、心膜、TriSeg、弁、拍動流の作動点が同時に変わるためである。

旧 Protocol C（fixed-TBV graded IVC-like preload reduction）は wet-lab の loading intervention を模した研究用案であり、最良の steady-TBV operating locus を短時間で示す現在の Web app の目的とは一致しない。したがって製品の起動経路・pane・fit claim から退役させる。歴史的設計と旧測定値は本書末尾に退役済み記録としてのみ残す。

## 旧実装から保持するものと捨てるもの

保持するものは、広いpreload範囲を自動探索する発想、canonical点を十分にsettleさせること、低preloadでalternansを見逃さないことである。速度優先のpreviewはこれらのsettled evidenceから型・線種・seed policyを分離する。

捨てるものは次の通りである。

- RAP を CVP、LAP を PCWP と無条件に同一視する表示
- TBV-only sweep を三次元 response surface と呼ぶこと
- period-2 の二拍を平均して一つの steady point にすること
- TBV sweep から intrinsic ESPVR / EDPVR を推定すること
- transient IVC-like intervention を通常の Web app 操作から起動すること
- ED / ES / SW の点群から cross-point ESPVR / EDPVR / PRSW claim を作ること
- legacy ModelCore Worker を scientific runtime の裏で起動すること

現在の pane では CVP を「cycle-mean transmural RAP のモデル内対応量」、PCWP を「cycle-mean transmural LAP surrogate」と明記する。

## Protocol A: fixed-volume vascular-function curve

### 目的

心臓の preload response とは独立に、現在の血管 PV law・外圧・抵抗から vascular return の構造曲線を表示する。

### 方法

source scenario の accepted periodic beat を一拍だけ読み出し、systemic return path と pulmonary venous return path の各 node / edge について cycle mean snapshot を作る。各 node では

$$
V_i = V_{u,i} + V_{s,i}(P_{tm,i}),
\qquad
P_{abs,i}=P_{tm,i}+P_{ext,i}
$$

を用いる。与えた downstream atrial pressure に対して、path 全体の stressed volume を保存しながら上流圧と flow を解く。線形抵抗だけでなく、source beat 内で現行 main-wire kernel が評価した圧依存抵抗と quadratic loss の cycle-mean equivalent、ならびに waterfall 条件を使用する。したがって curve 上の各仮想圧で圧依存抵抗を再評価する完全な quasistatic continuation ではない。

この曲線は「周期解から得た cycle-mean vascular snapshot に対する volume-constrained structural curve」である。外部ポンプを実装した実験ではないため、literal Guyton pump curve とは呼ばない。

## Protocol B: two-tier fixed-TBV preload operating locus V2

### B0: rapid 10-point finite-hold preview

通常の Workbench では、canonical continuation の完了を待たずに TBV response の概形を表示する。source baseline 1点、低容量5点、高容量4点の計10点を、低容量・高容量の二laneで探索する。

$$
\nu\in
\{0.64,0.70,0.76,0.82,0.88,1.00,
1.075,1.15,1.225,1.30\}.
$$

点の密度は、低容量側の非線形応答と periodicity boundary を早く視認するため低容量側へ厚く配分する。これは生理的正常範囲の宣言ではなく、現在の source scenario を固定した research preview envelope である。

各laneの最初の点では、source state の心腔容積、Land / SLS / TriSeg state、弁・流量 memory と cycle phase を保ち、11血管nodeの局所 compliance に応じて target TBV を配分する。二点目以後は同一laneの直近二つの provisional endpoint から血管容積の secant predictor を作り、compliance-weighted bounded projection で総TBVを targetへ厳密に合わせる。secantが利用不能または trust gateを外れた場合は、baseline compliance projectionへ戻る。

predictorによるstate jumpは、生体内の輸液・脱血時間過程を表さない。初期状態を次の作動点近傍へ置く数値操作であり、evidence windowから除外する。jump後に主モデルを**2自然拍**だけ時間発展させ、二拍目を finite-hold observation として記録する。

rapid preview の証拠型は canonical periodic result と共有しない。

- `near-period1-estimate`: full-state one-beat residualがpreview閾値内で収縮している近P1推定
- `finite-hold-unclassified`: 数値・event QCは通るが、2拍だけではperiodicityを分類できない観測
- `failure`: solver、mass / continuity、またはevent QC failure

どのpreview点にも `settledP1Locus=false`、`continuationSeed=false`、`espvrEdpvrPrswFit=false` を付ける。`near-period1-estimate` も P1 と呼ばず、`finite-hold-unclassified` とともに破線・open markerで表示する。preview stateはcanonical continuation seedへ流用せず、failureをまたいで曲線を補間しない。baseline sourceのみ、別途canonical source gateを通った既知のP1 evidenceである。

二つのpersistent workerはpreview lower / higher laneを並行実行し、各点が到着するたびにimmutable snapshotを返す。設計目標はbaseline表示後おおむね10秒以内に概形を得ることだが、これは機種・症例をまたぐ性能保証ではない。canonical P1/P2分類はpreview完了後も別経路で継続する。

### B1: canonical adaptive settled continuation

### 生理学的 claim と探索座標

source TBV を $V_B$、正規化 TBV を $\nu=V_{B,target}/V_B$ とする。V1 は

$$
0.90V_B,\;0.95V_B,\;V_B,\;1.05V_B,\;1.10V_B
$$

を同じ accepted source phase から独立に fork した。V2 は、低容量域で現れる periodicity boundary や非線形な圧・流量応答をより広く観察するため、hard exploration envelope を

$$
\boxed{0.35\leq\nu\leq1.30}
$$

へ拡張する。これは「生理的正常範囲」や全症例で安全に到達できる範囲ではなく、凍結した制御条件の下でモデルを調べる research stress envelope である。P1 が境界まで連続して存在することを仮定せず、P2、未収束、solver failure が続いた場合は到達不能な点を補間せず `unresolved-boundary` として終了する。

TBV-only sweep は依然として一自由度の closed-loop operating locus である。古典的な Frank–Starling / ventricular-function 実験の着想を受けるが、前負荷を独立に prescribed した isolated-heart curve でも、Guyton の external-pump venous-return experiment でもない。

### 凍結するものと自然に応答させるもの

探索中は HR、calcium-drive parameter、Land parameter、心筋受動 parameter、TriSeg / 心膜 parameter、弁 parameter、血管抵抗・PV law・unstressed volume・外圧を source と同一に保つ。自律神経・腎・体液調節による parameter update も行わない。したがって result の claim は `frozenAutonomicRenalAndVascularControls=true` である。

一方、各 target で chamber volume、血管 volume / pressure、Land / SLS / TriSeg state、弁・流量 memory は力学と循環式に従って時間発展し、新しい周期軌道へ settle する。「frozen controls」は動的 state を固定して一拍だけ評価するという意味ではない。protocol fork だけを更新し、source session は変更しない。

### predictor-assisted exact-TBV fork

各laneの最初のtarget、またはsecant predictorのtrust gateを外れたtargetでは、安全なfallbackとして注入・脱血分を systemic venous reservoir の SV と VC に与え、両者の nonlinear PV law に同一の transmural-pressure offset $\Delta P_v$ を加える。

$$
\sum_{i\in\{SV,VC\}}
\left[
V_i(P_{tm,i}+\Delta P_v)-V_i(P_{tm,i})
\right]
=V_{B,target}-V_{B,source}
$$

二つの同位相・同lane・採用済みP1 endpointがある場合は、11血管nodeのvolume secantから次targetを予測する。その予測を各nodeの局所complianceで重み付けしたbounded projectionへ通し、血管nodeの上下限を守りながらTBV errorを数値許容差内までゼロにする。心腔volume、Land state、SLS state、TriSeg coordinate、弁 opening memory、arterial-root flow memoryは予測で変更しない。直近stepに対する外挿比が大きい、方向が反転する、cycle phaseが一致しないなどtrust conditionを満たさない場合は上記SV / VC forkへfail closedする。

このpredictorはcold-startの長い材料過渡を避けるprotocol initializerであり、患者parameterでも生理的volume redistribution modelでもない。canonical evidenceはpredictor injection後の自然拍だけから計算し、initializer種別、入力P1、clampされたnode、fallback理由をprovenanceに残す。

preload locus の flow coordinate は一拍の net aortic-valve volume を L/min に換算した net cardiac output とする。forward-only aortic volume も protocol result に保持するが、逆流症例で両者を同一視しない。

### 双方向 continuation と seed policy

baseline P1 から二つの persistent branch worker を開始する。

- lower-volume lane: $1.00\rightarrow0.95\rightarrow\cdots\rightarrow0.35$
- higher-volume lane: $1.00\rightarrow1.05\rightarrow\cdots\rightarrow1.30$

各 lane では、一つ前に採用された P1 terminal checkpoint を次 target の start point とし、直近二つのP1がある場合だけ上記secant predictorを使う。低容量 lane と高容量 lane の state は共有しない。これは隣接作動点の近さを利用する numerical continuation であり、前の点から生理的な輸液・脱血過程を再生したという claim ではない。

次点の seed に採用できるのは P1 だけである。`period2-suspect`、未収束、solver failure の terminal state は次点へ渡さず、最後の P1 から小さい step で再試行する。この規則により、alternans branch を暗黙に P1 locus へ持ち込まない。

### adaptive step

初期 step は $\Delta\nu=0.05$、許容範囲は $0.025\leq\Delta\nu\leq0.10$ とする。直近三つの P1 point において、CO、mean transmural RAP、mean transmural LAP の中点値が両端の線形補間からどれだけ外れるかを用いて局所的な曲率 signal を作る。

- 24 beat以内で収束し、三 signal とも低曲率なら step を1.5倍する（上限0.10）。
- 24 beatを超えた場合、または少なくとも一つの signal が高曲率なら step を0.5倍する（下限0.025）。
- それ以外は step を保持する。
- P2 / failure では最後の P1 との中点へ step を縮める。minimum step で二回連続して block された lane は `unresolved-boundary` とする。

この adaptive policy は点数削減だけを目的としない。急な response と periodicity boundary の近傍で解像度を上げ、平坦で容易に収束する区間では冗長な solve を減らす。曲率閾値は物理 law ではなく versioned analysis policy であり、結果には target、seed、step、判断理由を provenance として残す。

### periodicity gate

非baseline target は main-wire canonical periodic policy をそのまま用いる。baseline は既に accepted periodic source であることを前提に同じ phase を一拍再生し、source endpoint に対する P1 tolerance の再現を確認する。baseline について新たな3拍連続判定を省略する代わりに、この一拍再現gateを通らなければ locus と後続point observationへ入れない。

- full accepted state の fixed dimensional scale による正規化
- P1 tolerance: $10^{-3}$
- P2 tolerance: $10^{-3}$
- 3 拍連続確認
- 最大 32 拍

P1 だけを preload locus の線に含める。canonical classifier が `period2-suspect` とした点は strong / weak branch を別々に保持して marker 表示するが、確定診断とは呼ばず、平均せず fit に使わない。solver failure と未収束点も欠損として隠さず表示する。P2、failure、`unresolved-boundary` をまたいで P1 point 間を線形補間してはならない。

この結果は Frank–Starling の closed-loop operating locus であり、古典的な isolated-heart ventricular function curve とも完全には同一でない。TBV 変更に伴い左右心、肺循環、心膜、弁、血管床が同時に新しい作動点へ移るためである。

### sparse independent audit

continuation は高速だが、異なる attractor branch を経路依存的に追跡する可能性がある。このため両 lane の終了後、到達した P1 point のうち $\nu=0.35,0.70,1.30$ に最も近い重複しない点を選び、baseline source phase から独立に volume fork して再計算する。

continuation と independent audit がともに P1 の場合、full accepted state を canonical fixed scales で比較する。maximum normalized delta が $10^{-3}$ 以下なら `matched`、超える場合は `path-dependence-suspect` とし、delta 自体も provenance に保持する。audit が P1 に収束しなければ `audit-failed` であり、continuation point の正誤を一方的に決めない。

`matched` は、その target と二つの initializer に関する再現性 evidence であり、軌道の一意性を数学的に証明しない。逆に mismatch は path dependence、複数 attractor、または不十分な settling を区別しないため、追加実験が必要という advisory evidence である。

### progressive result

job start は baseline replay と vascular structural curve を先に完了し、`vascular-ready` snapshot を返す。したがって Workbench は右・左 vascular curve と baseline point を先に表示できる。その後、lower / higher worker が一つの target を完了するたびに immutable snapshot を発行し、Starling preload point を順次追加する。全 envelope の完了を待ってから初めて pane を描画する必要はない。

UI上の「Guyton first」は表示順を指す略称であり、Protocol Aを literal Guyton pump curve へ昇格させるものではない。adaptive探索では最終 point 数が事前に確定しないため、progress は到着点数、累積 beat 数、active direction、stageを表示し、見せかけの固定percent完了率を作らない。

## TBV点に付随する ED / ES / SW observations

rapid previewとcanonical continuationは、各点で保持したcomplete beatからLVの観測量を計算できる。

- ED: aortic forward flow開始前に、MV / AoV flowの絶対値がほぼゼロでLV volumeが最大plateauにある最初のsample
- ES: aortic forward flowが終了するcrossing
- pressure: absolute pressureではなく、common intrathoracic / pericardial contributionを除いたLV transmural pressure
- SW: $SW=-\oint P_{LV,tm}\,dV_{LV}$

EDはcompetent-valveでのisovolumic onset surrogateである。逆流などによりisovolumic phaseが成立しない場合、無理にanchorを補間せずevent QCをrejectする。P2疑いではstrong / weak beatを別branchの観測として保持し、平均して一つの点にしない。rapid finite-hold点の観測には同じpreview evidence classを付け、settled valueへ昇格させない。

これらはそれぞれのTBV operating pointを説明する**観測値**であり、点間のintrinsic ventricular relationではない。現行Web appは次を行わない。

- ES点を直線・二次曲線へfitしてESPVRを主張する
- ED点を指数曲線へfitしてEDPVRまたはpassive material lawを主張する
- SW–EDV点を直線へfitしてPRSWを主張する
- preview点とsettled P1点、またはP1とP2 branchを同じfitへ混ぜる

ESPVR / EDPVR / PRSWが将来必要になった場合は、preloadを独立に制御でき、負荷変化中のevent、反射・心拍数・収縮性、心膜・右心 coupling、弁逆流を明示的にgateする別の研究protocolとして設計する。通常のTBV locus paneへ暗黙に追加しない。

## alternans / P2 policy

過去の low-volume alternans は、この機能を始める契機になった重要な反例である。V1 / V2 は次を禁止する。

- strong / weak beat の平均を「steady」と表示する
- P2 point を P1 Starling locus に混ぜる
- alternans を smoothing で消す

settled TBV locus では canonical full-state classifier により P1 と `period2-suspect` を判別する。rapid previewは2自然拍しか観測せず、人工的なpredictor seedを二拍前の自然状態として扱えないため、P2分類を一切行わない。rapid点は `near-period1-estimate` または `finite-hold-unclassified` に留め、alternans判定とstrong / weak branch表示はcanonical classifierの到着を待つ。

## Workbench / Worker semantics

- `GUYTON_RIGHT`: systemic vascular curve + RAP/CVP-side preload locus
- `GUYTON_LEFT`: pulmonary vascular curve + LAP/PCWP-surrogate-side preload locus
- TBV point detail: 選択点のPV loop + ED / ES / SW observations。cross-point fitなし
- `PV_RELATIONS`: **retired**。Protocol CおよびESPVR / EDPVR / PRSW fitを現行productから起動しない
- `GUYTON_3D`: V1 / V2 では unavailable。TBV-only surface は表示しない

protocol は scientific Worker の source session を read-only で参照する。結果 cache は scenario ID だけでなく source `revision / acceptedTime / TBV` identity で管理し、parameter transition 後の古い response は破棄する。同じ source への重複要求は deduplicate する。

branch workerへ渡すsource fingerprintは、source identity、mechanics provider identity、legacy 32-bit labelだけではない完全なaccepted transaction checkpoint、circulation / valve runtime、pericardium、calcium-drive configurationのcanonical JSON SHA-256とする。provider hashとstateの短いlabelをSHA-256で包み直しただけの値を、科学的provenanceとして再利用しない。

V2 の UI-facing command は `start / poll / cancel` job semantics とする。scenario Worker は baseline preparation と小さい immutable snapshot の受け渡しを担当し、長い lower / higher solve は二つの persistent child worker が担当する。accepted-state checkpoint は worker 内の trusted capsule に留め、UIへ送らない。各 child worker は同じ lane の次 target に再利用されるため、一つ前の P1 checkpoint をそのまま continuation seed にできる。

polling 中に source identity が変わった場合は古い job を cancel し、その partial curve を新しい scenario の evidence として継承しない。cancel / failure 後の worker は fail-closed で破棄し、次の job で作り直す。

`open-transient-no-periodic-claim` の間は expensive multi-beat protocol を自動再起動せず、旧 source の curve も現行 steady evidence として表示しない。通常 waveform には transient を表示したまま、次の accepted periodic source が得られた時点で新しい identity に対して protocol を再実行する。

## official healthy periodic checkpoint での V1 settled-locus実測

以下は5点を独立 fork した V1 の reference measurement であり、adaptive V2 の速度・点数・到達範囲を示す値ではない。実行時間は開発機での measurement であり acceptance threshold でもない。

- Guyton / Starling: 約 70.5 s
- TBV 5点: 全点 P1、各 23–26 拍（baseline は 1 拍）
- CO: 4.55–5.80 L/min
- transmural RAP: 2.06–4.25 mmHg
- transmural LAP: 4.96–11.77 mmHg
- fixed-TBV error: 約 $10^{-12}$ mL order

旧Protocol C / PV relationの測定値は、現行productのacceptance evidenceではないため後述の退役済み履歴へ移す。

## official healthy periodic checkpoint での V2 exploratory browser 実測

以下は開発機・development build における一回の exploratory measurement であり、性能保証や acceptance threshold ではない。V1 の固定5点 benchmark とは点数・探索範囲・audit 数が異なるため、単純な速度比較には用いない。

- vascular structural curve / baseline point: job start から約 1.6 s で先行表示
- adaptive continuation 完了: 約 211 s
- continuation P1 points: 20点
- high-volume lane: $\nu=1.30$ へ到達
- low-volume lane: $\nu\approx0.43$ 近傍まで P1 を確認し、その先は2回の minimum-step block 後に `unresolved-boundary`
- sparse independent audit: 3点。1点 `matched`、1点 `path-dependence-suspect`、1点 `audit-failed`

この結果で重要なのは、広い envelope の全 target を強制的に曲線へ埋めなかったことと、continuation の高速化と独立再現性を同じ claim にしなかったことである。`path-dependence-suspect` / `audit-failed` は現時点の healthy checkpoint にも initializer sensitivity または settling ambiguity が残ることを示すため、pane に advisory evidence として保持する。

## 退役済み履歴: 旧 Protocol C / PV relation fit

旧案はsource sessionを変更せず、protocol fork内だけで`VC_RA`抵抗を8拍にわたり1倍から64倍へ増やすfixed-TBV graded IVC-like preload reductionだった。これはwet-labで短いloading limbを得るIVC balloon occlusionの発想をWeb modelへ移したprotocol surrogateであり、解剖学的balloon modelではない。現行Web appの目的は、過渡そのものを模擬することではなく、最良のsteady-TBV operating locus近傍を短時間で得ることなので、この経路は退役した。

historical V1 measurementでは、この旧経路が約14.2秒、fixed-TBV errorが約$10^{-12}$ mL order、EDV 152.75→106.14 mL、ESV 64.22→48.75 mLだった。Klotz-informed $V_0$は80.79 mL、旧EDPVR fitは$R^2\approx0.999$、旧PRSW fitは$R^2\approx0.9999$だった一方、linear ESPVRはfree-$V_0$が約$-125$ mLとなりstability gateを通らずrejectされた。recoveryも12拍以内にfull-state P1へ戻らなかった。

これらは過去実装を理解するための履歴であり、現在のpane、runtime command、preset、validation claimへ持ち込まない。値の良いfitが得られたことも、旧surrogateの生理学的妥当性や現行モデルのintrinsic ESPVR / EDPVR / PRSWを証明しない。

## 限界と次段階

1. 真の Guyton pump experiment が必要なら、RA→Ao external pump、flow clamp、fixed stressed volume、pump-flow / RAP protocol を別 ID で実装する。
2. 二次元 surface が必要なら、TBV に加えて venous tone、PVR、contractility など一つの独立 coordinate を明示する。TBV-only data を補間して surface にしない。
3. intrinsic ESPVR / EDPVR / PRSWが必要なら、TBV sweepの点群を再利用せず、問いと介入を定義した別のresearch protocolを設計する。材料parameter同定にはcalcium-off / fully relaxed mechanicsとprescribed chamber loadingが必要である。
4. 弁逆流、心房細動、mechanical support、coronary / multipatchではED / ES eventとSW observationの適用可能性を個別にgateする。
5. rapid previewの2拍はsettlingを近似するものではない。症例横断でcanonical P1との差、P2見逃し、failure boundary、wall timeを測定し、preview閾値をP1 gateの代用にしない。
6. V2の二方向persistent workerとprogressive resultはUIの待ち時間と独立forkの過渡を減らすが、各beatのLand–TriSeg solve自体を近似してはいない。実測benchmarkではpreviewとsettledを分離し、wall time、総beat数、到達境界、P2 / failure、audit statusを報告する。
7. adaptive step、secant predictor、compliance projection、continuationは計算手順であり、生理lawではない。症例横断でaudit mismatchやunresolved boundaryが多い場合、step policyを緩めて曲線を埋める前に、複数attractor、periodicity gate、volume fork、低容量時の力学を再検討する。

## 文献

- Guyton AC, Lindsey AW, Abernathy B, Richardson T. *Venous return at various right atrial pressures and the normal venous return curve*. Am J Physiol. 1957. <https://doi.org/10.1152/ajplegacy.1957.189.3.609>
- Guyton AC, Lindsey AW, Kaufmann BN, Abernathy JB. *Effect of blood transfusion and hemorrhage on cardiac output and on the venous return curve*. Am J Physiol. 1958. <https://doi.org/10.1152/ajplegacy.1958.194.2.263>
- Beard DA, Feigl EO. *Understanding Guyton's venous return curves*. Am J Physiol Heart Circ Physiol. 2011. <https://pmc.ncbi.nlm.nih.gov/articles/PMC3191500/>
- Patterson SW, Piper H, Starling EH. *The regulation of the heart beat*. J Physiol. 1914. <https://doi.org/10.1113/jphysiol.1914.sp001676>
- Sarnoff SJ, Berglund E. *Ventricular function. I. Starling's law of the heart studied by means of simultaneous right and left ventricular function curves in the dog*. Circulation. 1954. <https://doi.org/10.1161/01.CIR.9.5.706>
- Levine BD, Lane LD, Buckey JC, Friedman DB, Blomqvist CG. *Left ventricular pressure-volume and Frank-Starling relations in endurance athletes*. Circulation. 1991. <https://doi.org/10.1161/01.CIR.84.3.1016>

以下のSagawa、Kass、Klotz、Burkhoffらの文献は、**退役済みProtocol C / relation-fit設計の歴史的背景**としてのみ残す。現行Web appがESPVR / EDPVR / PRSWを計算・表示する根拠ではない。

- Sagawa K, Suga H, Shoukas AA, Bakalar KM. *End-systolic pressure/volume ratio: a new index of ventricular contractility*. Am J Cardiol. 1977. <https://pubmed.ncbi.nlm.nih.gov/920611/>
- Sagawa K. *The end-systolic pressure-volume relation of the ventricle: definition, modifications and clinical use*. Circulation. 1981. <https://pubmed.ncbi.nlm.nih.gov/7014027/>
- Kass DA, Yamazaki T, Burkhoff D, Maughan WL, Sagawa K. *Determination of left ventricular end-systolic pressure-volume relationships by the conductance (volume) catheter technique*. Circulation. 1986. <https://pubmed.ncbi.nlm.nih.gov/2868811/>; <https://doi.org/10.1161/01.CIR.73.3.586>
- Kass DA, Maughan WL. *From Emax to pressure-volume relations: a broader view*. Circulation. 1988. <https://pubmed.ncbi.nlm.nih.gov/3286035/>
- Kass DA, et al. *Influence of contractile state on curvilinearity of in situ end-systolic pressure-volume relations*. Circulation. 1989. <https://pubmed.ncbi.nlm.nih.gov/2910541/>
- Klotz S, et al. *Single-beat estimation of end-diastolic pressure-volume relationship*. Am J Physiol Heart Circ Physiol. 2006. <https://doi.org/10.1152/ajpheart.01240.2005>
- Burkhoff D, Mirsky I, Suga H. *Assessment of systolic and diastolic ventricular properties via pressure-volume analysis*. Am J Physiol Heart Circ Physiol. 2005. <https://doi.org/10.1152/ajpheart.00138.2005>

以下は現行のalternans / periodicity / numerical-continuation policyの背景である。

- McGaughey MD, Maughan WL, Sunagawa K, Sagawa K. *Alternating contractility in pulsus alternans studied in the isolated canine heart*. Circulation. 1985. <https://doi.org/10.1161/01.CIR.71.2.357>
- Adler D, Mahler Y, Mellits ED, et al. *Mechanism of sustained mechanical alternans: effect of variations in ventricular filling volume*. Circ Res. 1991. <https://doi.org/10.1161/01.RES.69.1.26>
- van Osta N, Van Den Acker G, Van Loon T, Arts T, Delhaas T, Lumens J. *Numerical accuracy of closed-loop steady state in a zero-dimensional cardiovascular model*. Philos Trans A Math Phys Eng Sci. 2025. <https://doi.org/10.1098/rsta.2024.0208>
- Corvalan CM, Saita FA. *Automatic stepsize control in continuation procedures*. Comput Chem Eng. 1991. <https://doi.org/10.1016/0098-1354(91)85018-P>
- Aruliah DA, van Veen L, Dubitski A. *Algorithm 956: PAMPAC, a parallel adaptive method for pseudo-arclength continuation*. ACM Trans Math Softw. 2016. <https://doi.org/10.1145/2714570>

Guyton、Patterson–Starling、Sarnoff–Berglund、Levineらは生理学的な概念境界とloading情報の価値の根拠であり、TBV continuationの忠実性を直接検証する文献ではない。van Ostaらはclosed-loop modelで定常判定と必要beat数を明示的に扱う背景、Corvalan–SaitaとAruliahらはadaptive / parallel continuationの数値的方法論の背景として引用する。本実装はpseudo-arclength continuationやPAMPACの再実装ではない。これらをもって本モデルの$0.35$–$1.30$ envelope、rapid-preview targets、step threshold、二worker構成が実験的に妥当と証明されたとは主張しない。
