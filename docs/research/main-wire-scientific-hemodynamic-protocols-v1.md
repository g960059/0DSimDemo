# Main-wire Guyton / Starling・LV ESPVR / EDPVR protocol V1 / V2

## 結論

旧 Guyton / Starling pane の意図は有用だが、同じ sweep を複数の生理学的概念に流用してはいけない。V1 / V2 では次の三つを明示的に分離する。

1. 固定血液量・固定血管特性から求める vascular-function curve
2. fixed-TBV closed-loop 周期点からなる Frank–Starling preload operating locus
3. fixed-TBV の一過性 preload reduction から得る LV ESPVR / EDPVR / PRSW

TBV だけを変える実験は一自由度なので、結果は CVP–PCWP–CO 空間上の一次元 locus であり、二次元 surface ではない。また、外部ポンプで右房圧と流量を独立操作した Guyton の原実験そのものでもない。

## 旧実装から保持するものと捨てるもの

保持するものは、広い preload 範囲を自動探索する発想、各点を十分に settle させること、低 preload で alternans を見逃さないことである。

捨てるものは次の通りである。

- RAP を CVP、LAP を PCWP と無条件に同一視する表示
- TBV-only sweep を三次元 response surface と呼ぶこと
- period-2 の二拍を平均して一つの steady point にすること
- TBV sweep から intrinsic ESPVR / EDPVR を推定すること
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

## Protocol B: adaptive fixed-TBV preload operating locus V2

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

### volume fork

注入・脱血分は systemic venous reservoir の SV と VC のみに与え、両者の nonlinear PV law に同一の transmural-pressure offset $\Delta P_v$ を加える。

$$
\sum_{i\in\{SV,VC\}}
\left[
V_i(P_{tm,i}+\Delta P_v)-V_i(P_{tm,i})
\right]
=V_{B,target}-V_{B,source}
$$

baseline から各 lane の最初の target を作る場合は、Land state、SLS state、TriSeg coordinate、弁 opening memory、arterial-root flow memory、chamber volume を source phase から保持し、上式による volume fork だけを加える。これは cold-start の長い材料過渡を避ける protocol initializer であり、患者 parameter ではない。

preload locus の flow coordinate は一拍の net aortic-valve volume を L/min に換算した net cardiac output とする。forward-only aortic volume も protocol result に保持するが、逆流症例で両者を同一視しない。

### 双方向 continuation と seed policy

baseline P1 から二つの persistent branch worker を開始する。

- lower-volume lane: $1.00\rightarrow0.95\rightarrow\cdots\rightarrow0.35$
- higher-volume lane: $1.00\rightarrow1.05\rightarrow\cdots\rightarrow1.30$

各 lane では、一つ前に採用された P1 terminal checkpoint を次 target の start point とする。低容量 lane と高容量 lane の state は共有しない。これは隣接作動点の近さを利用する numerical continuation であり、前の点から生理的な輸液・脱血過程を再生したという claim ではない。

次点の seed に採用できるのは P1 だけである。`period2-suspect`、未収束、solver failure の terminal state は次点へ渡さず、最後の P1 から小さい step で再試行する。この規則により、alternans branch を暗黙に P1 locus へ持ち込まない。

### adaptive step

初期 step は $\Delta\nu=0.05$、許容範囲は $0.025\leq\Delta\nu\leq0.10$ とする。直近三つの P1 point において、CO、mean transmural RAP、mean transmural LAP の中点値が両端の線形補間からどれだけ外れるかを用いて局所的な曲率 signal を作る。

- 24 beat以内で収束し、三 signal とも低曲率なら step を1.5倍する（上限0.10）。
- 24 beatを超えた場合、または少なくとも一つの signal が高曲率なら step を0.5倍する（下限0.025）。
- それ以外は step を保持する。
- P2 / failure では最後の P1 との中点へ step を縮める。minimum step で二回連続して block された lane は `unresolved-boundary` とする。

この adaptive policy は点数削減だけを目的としない。急な response と periodicity boundary の近傍で解像度を上げ、平坦で容易に収束する区間では冗長な solve を減らす。曲率閾値は物理 law ではなく versioned analysis policy であり、結果には target、seed、step、判断理由を provenance として残す。

### periodicity gate

非baseline target は main-wire canonical periodic policy をそのまま用いる。baseline は既に accepted periodic source であることを前提に同じ phase を一拍再生し、source endpoint に対する P1 tolerance の再現を確認する。baseline について新たな3拍連続判定を省略する代わりに、この一拍再現gateを通らなければ locus と後続 relation fitへ入れない。

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

## Protocol C: fixed-TBV transient preload reduction

### 介入

source state を変更せず、protocol fork 内だけで systemic venous return edge `VC_RA` の抵抗を増加させる。

$$
R_{VC\rightarrow RA}^{protocol}(t)
=s(t)R_{VC\rightarrow RA},
\qquad
s:1\rightarrow64
$$

8 拍の間に $\log s$ を smoothstep で連続的に増加させる。TBV、HR、calcium drive、Land parameter、血管 PV law、他の抵抗、弁 parameter は固定する。抵抗倍率は primal residual と analytic Jacobian の両方へ同じように適用する。source beat が P1 closure を再現しない場合、baseline を含む relation fit は開始しない。

これは IVC balloon occlusion の完全な解剖学モデルではなく、fixed-TBV の graded IVC-like preload reduction である。Kass らの conductance-catheter 研究が用いた短時間の IVC balloon occlusion と同様に、循環血液量そのものを変えず短い loading limb を得て、遅い反射性変化の混入を避けることを狙う。ただし、本実装は一拍ごとにも抵抗履歴が変わる protocol surrogate であり、解剖学的 balloon model ではない。右心系を介した transit delay があるため、実際に EDV が変化し始めるまでの beat は raw loop として残す一方、fit からは冗長点を除く。

### fit point selection

baseline と、その直前の採用点より EDV が $\max(0.5\,\mathrm{mL},\;0.01V_{ED,baseline})$ 以上減少した beat を用いる。増加・停滞した初期 beat は raw evidence として表示するが fit しない。これらは changing-load transient の `fit-eligible` point であり、P1 periodic orbit と呼ばない。alternans-suspect、event failure、mass-conservation failure は別の reject reason になる。

### ED / ES event

- ED: aortic forward flow 開始前に、MV/AoV flow の絶対値がほぼゼロで LV volume が最大 plateau にある最初の sample
- ES: aortic forward flow が終了する crossing
- pressure: absolute pressure ではなく common intrathoracic / pericardial contributionを除いた LV transmural pressure

ED は competent-valve の isovolumic onset surrogate である。逆流により isovolumic phase が成立しない場合は、無理に anchor を作らず event QC を reject する。

### ESPVR

primary sensitivity は

$$
P_{es,tm}=E_{es}(V_{es}-V_0)
$$

の free-$V_0$ linear regression とする。同時に

$$
P_{es,tm}=aV_{es}^2+bV_{es}+c
$$

を sensitivity fit として計算し、linear fit に対する RMSE 改善と loading range 内の local slope variation を評価する。quadratic evidence が強い場合、一本の linear ESPVR は採用せず、dashed diagnostic curve と raw ES anchors だけを表示する。

主な gate は point 数、EDV span、end-systolic pressure span、positive slope、adjusted $R^2$、RMSE、leave-one-out slope stability、quadratic nonlinearity である。閾値は形状 fitting 用 knob ではなく、過剰な生理 claim を防ぐ analysis policy である。

### EDPVR

EDPVR は

$$
P_{ed,tm}=P_0+\alpha
\left[\exp\{\beta(V_{ed}-V_{ref})\}-1\right],
\qquad \alpha>0,\;\beta>0
$$

で表す。三つの自由 parameter を狭い loading range から同時推定しないため、baseline ED point $(V_m,P_m)$ から Klotz らの single-beat relation

$$
V_0\approx V_m(0.6-0.006P_m)
$$

を reference-volume prior として用い、$P_0=0$ を固定して $\alpha,\beta$ を multi-beat data に fit する。

これは Klotz single-beat curve の再実装ではなく、Klotz-informed $V_0$ prior を使った multi-beat exponential operating envelope である。また、心房収縮、心膜、TriSeg coupling、incomplete relaxation を含む end-diastolic operating points なので、myocardial passive material law の同定とは呼ばない。

loading limb の後には `VC_RA` 倍率を1へ戻して最大12拍の recovery を別 fork 内で観察する。これは可逆性と過渡長を示す advisory evidence であり、source session はそもそも変更されない。recovery 未収束を隠してはならないが、loading-limb fit の数値QCとは別に表示する。

### PRSW

ESPVR と独立な systolic cross-check として

$$
SW=M_w(V_{ed}-V_w),
\qquad
SW=-\oint P_{LV,tm}\,dV_{LV}
$$

を計算する。PRSW が安定して ESPVR が非線形・不安定であれば、単に protocol 全体が壊れたのではなく、end-systolic point relation または model response の再検討が必要という情報になる。

## alternans / P2 policy

過去の low-volume alternans は、この機能を始める契機になった重要な反例である。V1 / V2 は次を禁止する。

- strong / weak beat の平均を「steady」と表示する
- P2 point を linear ESPVR、EDPVR、PRSW、Starling locus に混ぜる
- alternans を smoothing で消す

settled TBV locus では canonical full-state classifier により P1 と `period2-suspect` を判別する。一方、graded preload protocol は各拍の load が異なるため、stroke-work trend を除いた residual の交互符号と separation だけから P2 orbit を確定できない。ここでは `alternans-suspect-high/low` とだけ表示し、異なる負荷の拍を疑似的な strong / weak P2 branch に合成せず、該当 beat と relation claim 全体を保守的に reject する。

## Workbench / Worker semantics

- `GUYTON_RIGHT`: systemic vascular curve + RAP/CVP-side preload locus
- `GUYTON_LEFT`: pulmonary vascular curve + LAP/PCWP-surrogate-side preload locus
- `PV_RELATIONS`: multi-beat LV PV loops + ED/ES anchors + ESPVR / EDPVR / PRSW
- `GUYTON_3D`: V1 / V2 では unavailable。TBV-only surface は表示しない

protocol は scientific Worker の source session を read-only で参照する。結果 cache は scenario ID だけでなく source `revision / acceptedTime / TBV` identity で管理し、parameter transition 後の古い response は破棄する。同じ source への重複要求は deduplicate する。

V2 の UI-facing command は `start / poll / cancel` job semantics とする。scenario Worker は baseline preparation と小さい immutable snapshot の受け渡しを担当し、長い lower / higher solve は二つの persistent child worker が担当する。accepted-state checkpoint は worker 内の trusted capsule に留め、UIへ送らない。各 child worker は同じ lane の次 target に再利用されるため、一つ前の P1 checkpoint をそのまま continuation seed にできる。

polling 中に source identity が変わった場合は古い job を cancel し、その partial curve を新しい scenario の evidence として継承しない。cancel / failure 後の worker は fail-closed で破棄し、次の job で作り直す。

`open-transient-no-periodic-claim` の間は expensive multi-beat protocol を自動再起動せず、旧 source の curve も現行 steady evidence として表示しない。通常 waveform には transient を表示したまま、次の accepted periodic source が得られた時点で新しい identity に対して protocol を再実行する。

## official healthy periodic checkpoint での V1 実測

以下は5点を独立 fork した V1 の reference measurement であり、adaptive V2 の速度・点数・到達範囲を示す値ではない。実行時間は開発機での measurement であり acceptance threshold でもない。

- Guyton / Starling: 約 70.5 s
- TBV 5点: 全点 P1、各 23–26 拍（baseline は 1 拍）
- CO: 4.55–5.80 L/min
- transmural RAP: 2.06–4.25 mmHg
- transmural LAP: 4.96–11.77 mmHg
- PV relation protocol: 約 14.2 s
- fixed-TBV error: 約 $10^{-12}$ mL order
- EDV: 152.75 → 106.14 mL
- ESV: 64.22 → 48.75 mL
- Klotz-informed $V_0$: 80.79 mL
- EDPVR: accepted ($R^2\approx0.999$)
- PRSW: accepted ($R^2\approx0.9999$)
- linear ESPVR: rejected。free-$V_0$ fit は $E_{es}\approx0.53$ mmHg/mL、$V_0\approx-125$ mL となり、leave-one-out instability と quadratic sensitivity gate を通らない
- 12-beat recovery: full-state P1 へ未収束。source session 自体は変更されない

linear ESPVR の reject は消すべき UI エラーではない。現時点の model / loading protocol では一本の生理的な linear ESPVR claim を支持できないという結果であり、pane では dashed diagnostic fit と reject reason を表示する。

## official healthy periodic checkpoint での V2 exploratory browser 実測

以下は開発機・development build における一回の exploratory measurement であり、性能保証や acceptance threshold ではない。V1 の固定5点 benchmark とは点数・探索範囲・audit 数が異なるため、単純な速度比較には用いない。

- vascular structural curve / baseline point: job start から約 1.6 s で先行表示
- adaptive continuation 完了: 約 211 s
- continuation P1 points: 20点
- high-volume lane: $\nu=1.30$ へ到達
- low-volume lane: $\nu\approx0.43$ 近傍まで P1 を確認し、その先は2回の minimum-step block 後に `unresolved-boundary`
- sparse independent audit: 3点。1点 `matched`、1点 `path-dependence-suspect`、1点 `audit-failed`

この結果で重要なのは、広い envelope の全 target を強制的に曲線へ埋めなかったことと、continuation の高速化と独立再現性を同じ claim にしなかったことである。`path-dependence-suspect` / `audit-failed` は現時点の healthy checkpoint にも initializer sensitivity または settling ambiguity が残ることを示すため、pane に advisory evidence として保持する。

## 限界と次段階

1. 真の Guyton pump experiment が必要なら、RA→Ao external pump、flow clamp、fixed stressed volume、pump-flow / RAP protocol を別 ID で実装する。
2. 二次元 surface が必要なら、TBV に加えて venous tone、PVR、contractility など一つの独立 coordinate を明示する。TBV-only data を補間して surface にしない。
3. ESPVR の rejection が症例横断で続く場合は、閾値を緩める前に end-systolic event、afterload evolution、Land length dependence、arterial pressure decay、nonlinear ESPVR を調べる。
4. EDPVR は passive inflation test ではない。材料 parameter 同定が必要なら calcium-off / fully relaxed mechanics と prescribed chamber loading を別 protocol とする。
5. 弁逆流、心房細動、mechanical support、coronary / multipatch では event と intervention の適用可能性を個別に gate する。
6. Klotz-informed prior は任意の陰圧・極端な高EDP・小児心へ無条件に外挿しない。現在も不正な reference geometry はfit QCでrejectするが、症例別の適用範囲gateは今後追加する。
7. V2 の二方向 persistent worker と progressive result は UI の待ち時間と独立 fork の過渡を減らすが、各 beat の Land–TriSeg solve 自体を近似してはいない。実測 benchmark では wall time、総 beat 数、到達境界、P2 / failure、audit status を分けて報告する。
8. adaptive step と continuation は計算手順であり、生理 law ではない。症例横断で audit mismatch や unresolved boundary が多い場合、step policy を緩めて曲線を埋める前に、複数 attractor、periodicity gate、volume fork、低容量時の力学を再検討する。

## 文献

- Guyton AC, Lindsey AW, Abernathy B, Richardson T. *Venous return at various right atrial pressures and the normal venous return curve*. Am J Physiol. 1957. <https://doi.org/10.1152/ajplegacy.1957.189.3.609>
- Guyton AC, Lindsey AW, Kaufmann BN, Abernathy JB. *Effect of blood transfusion and hemorrhage on cardiac output and on the venous return curve*. Am J Physiol. 1958. <https://doi.org/10.1152/ajplegacy.1958.194.2.263>
- Beard DA, Feigl EO. *Understanding Guyton's venous return curves*. Am J Physiol Heart Circ Physiol. 2011. <https://pmc.ncbi.nlm.nih.gov/articles/PMC3191500/>
- Patterson SW, Piper H, Starling EH. *The regulation of the heart beat*. J Physiol. 1914. <https://doi.org/10.1113/jphysiol.1914.sp001676>
- Sarnoff SJ, Berglund E. *Ventricular function. I. Starling's law of the heart studied by means of simultaneous right and left ventricular function curves in the dog*. Circulation. 1954. <https://doi.org/10.1161/01.CIR.9.5.706>
- Levine BD, Lane LD, Buckey JC, Friedman DB, Blomqvist CG. *Left ventricular pressure-volume and Frank-Starling relations in endurance athletes*. Circulation. 1991. <https://doi.org/10.1161/01.CIR.84.3.1016>
- Sagawa K, Suga H, Shoukas AA, Bakalar KM. *End-systolic pressure/volume ratio: a new index of ventricular contractility*. Am J Cardiol. 1977. <https://pubmed.ncbi.nlm.nih.gov/920611/>
- Sagawa K. *The end-systolic pressure-volume relation of the ventricle: definition, modifications and clinical use*. Circulation. 1981. <https://pubmed.ncbi.nlm.nih.gov/7014027/>
- Kass DA, Yamazaki T, Burkhoff D, Maughan WL, Sagawa K. *Determination of left ventricular end-systolic pressure-volume relationships by the conductance (volume) catheter technique*. Circulation. 1986. <https://pubmed.ncbi.nlm.nih.gov/2868811/>; <https://doi.org/10.1161/01.CIR.73.3.586>
- Kass DA, Maughan WL. *From Emax to pressure-volume relations: a broader view*. Circulation. 1988. <https://pubmed.ncbi.nlm.nih.gov/3286035/>
- Kass DA, et al. *Influence of contractile state on curvilinearity of in situ end-systolic pressure-volume relations*. Circulation. 1989. <https://pubmed.ncbi.nlm.nih.gov/2910541/>
- Klotz S, et al. *Single-beat estimation of end-diastolic pressure-volume relationship*. Am J Physiol Heart Circ Physiol. 2006. <https://doi.org/10.1152/ajpheart.01240.2005>
- Burkhoff D, Mirsky I, Suga H. *Assessment of systolic and diastolic ventricular properties via pressure-volume analysis*. Am J Physiol Heart Circ Physiol. 2005. <https://doi.org/10.1152/ajpheart.00138.2005>
- McGaughey MD, Maughan WL, Sunagawa K, Sagawa K. *Alternating contractility in pulsus alternans studied in the isolated canine heart*. Circulation. 1985. <https://doi.org/10.1161/01.CIR.71.2.357>
- Adler D, Mahler Y, Mellits ED, et al. *Mechanism of sustained mechanical alternans: effect of variations in ventricular filling volume*. Circ Res. 1991. <https://doi.org/10.1161/01.RES.69.1.26>
- van Osta N, Van Den Acker G, Van Loon T, Arts T, Delhaas T, Lumens J. *Numerical accuracy of closed-loop steady state in a zero-dimensional cardiovascular model*. Philos Trans A Math Phys Eng Sci. 2025. <https://doi.org/10.1098/rsta.2024.0208>
- Corvalan CM, Saita FA. *Automatic stepsize control in continuation procedures*. Comput Chem Eng. 1991. <https://doi.org/10.1016/0098-1354(91)85018-P>
- Aruliah DA, van Veen L, Dubitski A. *Algorithm 956: PAMPAC, a parallel adaptive method for pseudo-arclength continuation*. ACM Trans Math Softw. 2016. <https://doi.org/10.1145/2714570>

Guyton、Patterson–Starling、Sarnoff–Berglund、Levine らは生理学的な概念境界と graded unloading / loading の情報価値の根拠であり、TBV continuation の忠実性を直接検証する文献ではない。van Osta らは closed-loop model で定常判定と必要 beat 数を明示的に扱う背景、Corvalan–Saita と Aruliah らは adaptive / parallel continuation の数値的方法論の背景として引用する。本実装は pseudo-arclength continuation や PAMPAC の再実装ではない。これらをもって本モデルの $0.35$–$1.30$ envelope、step threshold、二worker構成が実験的に妥当と証明されたとは主張しない。
