# LVP / AoP peak timing and LV pressure-volume loop morphology: literature audit

2026-09-07. Research only; no model, parameter, threshold, registry, or mint decision changed.

追補: LV PV loop の実測形状、駆出後半の曲率・二峰性・AV閉鎖付近の再上昇を追加調査した。さらに正常の正規化PV、虚血、MR、TAVI、同期不全、RVと負荷条件、形状指標まで検索を拡張した。下記「追補: LV PV loop の形状」に、原著図の確認箇所、測定法、独自の数理的考察、現モデルへの適用限界を記載する。

## 結論

「正常な LVP / AoP の最高圧は AV 開放から閉鎖までの 30–50% に存在しなければならない」という普遍的な基準は、今回確認した原著からは支持できない。AoP は正常対照でも早期優位・ほぼ等高・後期優位の波形を持ち、正常対照の侵襲的同時記録には LVP と AoP の双方が駆出後半で最高になる例がある。

ただし「後半ピークも実在する」は「どんな後半ピークでも妥当」「現候補の生理を検証済み」という意味ではない。特に単一例の図から正常範囲や percentiles を作らない。若年健常・中高年の非罹患・臨床検査で病変を否定された対照を同一視しない。

## 測定の定義

評価したい量は phiP = (駆出中の最高圧時刻 - AV 開放時刻) / (AV 閉鎖時刻 - AV 開放時刻)。LVP と AoP を別々に測る。

- 圧波形の第1ピーク／肩 P1 と第2ピーク／肩 P2 は、波形全体の最高点とは別の特徴点。P1 と P2 の高さが入れ替わると、argmax の時刻は不連続に飛び得る。
- AoP の足から切痕までの pressure-derived ejection period、正方向流量が存在する区間、弁の画像上の開放区間は完全には同じでない。
- ECG の R/Q 波を起点とした時間は pre-ejection period を含む。ET を分母にする前に起点を揃える。
- 流速／流量ピークの AT/ET、瞬時圧較差のピーク、最大 dP/dt、最大壁応力、最大 elastance は、LVP / AoP 最高圧時刻ではない。
- 伝達関数による推定 AoP、頸動脈圧、橈骨動脈圧、上行大動脈内 micromanometer を区別する。

## 主要エビデンス

### 1. Murgo et al., Circulation 1980: 正常対照での AoP 波形の多様性

[Aortic input impedance in normal man: relationship to pressure wave forms](https://pubmed.ncbi.nlm.nih.gov/7379273/). DOI 10.1161/01.CIR.62.1.105. Abstract と原著本文の転記を確認。

心カテーテル検査を受け、心血管疾患が見つからなかった18人。上行大動脈の圧と流速を同位置のセンサーで同時測定。A型7人は後期優位、B型7人は早期と後期がほぼ等高、C型4人は早期優位。本文定義ではB型も最高圧は後期にあり、増高が小さい。年齢構成と選択されたカテーテル対照集団のため、この割合を一般健常人口の出現率にはしない。本文 Table 2 の時間は inflection timing であり、global peak timing ではない。

### 2. Murgo et al., JCI 1980: LVP / AoP 同時実測の正常対照例

[Dynamics of left ventricular ejection in obstructive and nonobstructive hypertrophic cardiomyopathy](https://doi.org/10.1172/JCI109990). 原著 Methods、Figure 1、関連説明を確認。PDF p.3、誌面 p.1371 をレンダーして図を視認。

HCM の論文だが Figure 1 は正常対照の記録であることを本文が明記している。正常対照全体は29人、年齢37±10歳。図には早期の流量ピークと、後半で高くなる LVP / AoP が同時に描かれている。図示された SEP に対して圧の最高点は概ね後半、目視では約3/4付近。これは図の概読であって著者が報告した phiP の集団統計ではない。近接・重複する圧線から数msの LV–Ao peak lag は推定しない。

PDF原本（変更なし）: :codex-file-citation{path="/tmp/pressure-peak-research.Ejq4bO/murgo1980-jci.pdf" purpose="source"}

### 3. Kelly et al., Circulation 1989: 年齢と測定位置

[Noninvasive determination of age-related changes in the human arterial pulse](https://pubmed.ncbi.nlm.nih.gov/2598428/). DOI 10.1161/01.CIR.80.6.1652. Abstract確認。

正常対象1,005人、2–91歳、頸動脈・橈骨・大腿の高忠実度トノメトリー。若年頸動脈では後半の第2ピークは低く、加齢に伴い第1ピークと融合・優位化する。橈骨では同じ変化でも第2波が第1波を越えない。頸動脈データを無補正で侵襲的 AoP の絶対時刻へ移植しない。年代別平均図は個人の正常範囲ではない。

### 4. McEniery et al., JACC 2005: 大規模正常血圧集団

[Normal vascular aging: differential effects on wave reflection and aortic pulse wave velocity: ACCT](https://pubmed.ncbi.nlm.nih.gov/16256881/). DOI 10.1016/j.jacc.2005.07.037. Abstract確認。

健常・正常血圧4,001人、18–90歳。加齢に伴う augmentation と PWV の変化は一様な直線でない。年齢を跨いだ単一波形目標が不適切なことの背景資料。最高圧時刻/ET の基準範囲を提供する論文としては採用しない。

### 5. Pecha et al., Heart and Vessels 2016（online 2014）: 正常対照の時刻数値

[Pulse wave analysis of the aortic pressure waveform in patients with vasovagal syncope](https://pubmed.ncbi.nlm.nih.gov/25164239/). DOI 10.1007/s00380-014-0576-6. Abstract確認、全文の ET 表は今回取得できず。

失神既往なし・tilt陰性の対照39人、36.9±16歳。橈骨トノメトリーから伝達関数で推定した大動脈波形。対照の第1肩 T1 = 110±12 ms、第2のピーク T2 = 208±21 ms。これは実測由来の時間尺度として有用だが、同一対象の ET を確認できていないため、正常 phiP やその SD を捏造しない。T2 が全個体の global maximum だったとまでは読めない。

### 6. Melnikov et al., Physiological Reports 2025: 若年男性の資料

[Time course of cardiovascular responses to acute sustained handgrip exercise in young physically active men](https://pmc.ncbi.nlm.nih.gov/articles/PMC11965698/). DOI 10.14814/phy2.70286. Methods、Table 2、Figure 2 captionを確認。

18–23歳の身体活動性が高い男性23人。安静 HR58.6±9.1、推定 AoP の augmentation pressure -0.17±2.85 mmHg。Table 2 の T1 = 11.6±2.8% は ET の百分率と断定できず、同論文の LVRT は全周期を分母とする。Figure 2 は Wiggers を改変した模式図で、軸は見やすさのため伸ばされている。LVP 実測波形／正常ピーク位相の資料として使用しない。

### 7. Hughes et al., PLOS ONE 2013: 波形から機序を決めつけない

[Limitations of augmentation index in the assessment of wave reflection in normotensive healthy individuals](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0059371). DOI 10.1371/journal.pone.0059371. Abstract、Methods、Results確認。

正常血圧65人、21–78歳。頸動脈圧と流速を用いて比較。AIx と圧・流量による反射指標は単純に対応せず、第1肩の時刻も独立した反射波時刻と同一ではなかった。したがって P1 = 純粋な駆出波、P2 = 純粋な反射波と等置せず、後期ピークだけから反射の強さや Zc 不足を同定しない。

### 8. Chirinos et al., Circulation 2009: 圧と心筋負荷のピークは異なる

[Time-varying myocardial stress and systolic pressure-stress relationship](https://pubmed.ncbi.nlm.nih.gov/19451350/). DOI 10.1161/CIRCULATIONAHA.108.829366. Abstract確認。

正常血圧42人、未治療高血圧42人、治療中42人、いずれも正常EF。頸動脈圧、Doppler、心室形態から壁応力を算出。最大壁応力は典型的に駆出最初の100 ms以内で、圧の後期増高とは異なる。最大圧の時刻を Ca、活性張力、壁応力、elastance の最大時刻と同一視しない根拠。

### 9. Cheng et al., J Clin Hypertens 2025: 最近の大規模ピーク時刻研究

[Association of total mortality and cardiovascular endpoints with the timing of the first and second systolic peak of the aortic pulse wave](https://onlinelibrary.wiley.com/doi/10.1111/jch.14962). DOI 10.1111/jch.14962. Full text、Table 1–2確認。

5,529人、年齢54.2±14.4歳、HR65.5±11.3。TP1 = 102.8±14.5 ms、TP2 = 228.3±22.5 ms。ただし高血圧71.3%、心血管疾患既往14.1%を含み、正常値集団ではない。短い TP2 と予後不良の関連もあり、「第2ピークは早いほど正常」とする単純化を支持しない。予後関連は介入効果でも正常範囲でもなく、global argmax/ET の閾値ではない。

### 10. Zócalo & Bia, Front Physiol 2022: 正常参照値と方法間非互換性

[Central pressure waveform-derived indexes obtained from carotid and radial tonometry and brachial oscillometry in healthy subjects](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2021.774390/full). DOI 10.3389/fphys.2021.774390（出版2022）。MethodsとDiscussion確認。

年齢・性・身長別に圧波形派生指標を扱う研究。測定手法間に系統差・比例誤差があり、参照値を相互交換できない。主に AP、AIx、Pf/Pb 等で、LVP global peak/ET の正常範囲は提供していない。

## 数値は見つかったが正常 gate に採用しない資料

### Roeder et al., BMC Cardiovasc Disord 2020

[Increased augmentation index in patients with Ehlers-Danlos syndrome](https://pmc.ncbi.nlm.nih.gov/articles/PMC7493396/). DOI 10.1186/s12872-020-01684-x。

本文は aortic T1/T2 と述べる一方、Table 3 は明記して Peripheral T1/T2。対照61人の109 (104/119) ms、209 (202/221) msとET302 (288/316) msを割って「AoPの正常比率」とはしない。対照にも喫煙・高血圧が含まれる。MethodsとTables 1/3を原本で確認した。

PDF原本: :codex-file-citation{path="/tmp/pressure-peak-research.Ejq4bO/eds2020.pdf" purpose="source"}

### Dymott, University of Glasgow MD thesis 2011

[Cardiovascular disease and type 2 diabetes](https://theses.gla.ac.uk/2788/1/2011dymottMD.pdf)。Table 3.1/3.3/3.4確認。

対照63人、年齢60.0±10.2歳の T1=112.2±9.9 ms、T2=240.7±18.9 ms、ED=337.6±21.4 ms。平均値の比は約0.332、0.713。ただし高血圧25.4%、薬物使用もあり、厳密な健常集団でない。平均値の比は個人比率の平均/SDでもない。学位論文という性格も含め、時間尺度の補助例に留める。

PDF原本: :codex-file-citation{path="/tmp/pressure-peak-research.Ejq4bO/dymott2011.pdf" purpose="source"}

### 概説・動物・計算モデル

- [British Society of Echocardiography, diastolic function guidance 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11145885/) は LVP peak を mid systole と定性的に説明する。しかし起点と分布が定義された phiP 正常域ではない。
- [Time course of pressure and flow in ascending aorta during ejection, 1991](https://doi.org/10.1016/0167-5273(91)90092-4) は犬10頭。負荷や dobutamine で圧と流量のピーク間隔が変化する機序資料。ヒト正常域には使用しない。
- [Karamanoglu & Feneley 1999](https://pubmed.ncbi.nlm.nih.gov/10444472/) は計算モデルで、駆出パターンも後期増高に重要なことを示す。実測正常域ではない。
- [The effect of left ventricular contractility on arterial hemodynamics, 2021](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0255561) の圧ピーク0.23秒は計算モデルの結果。健常実測値として循環参照しない。
- [Delayed time to peak velocity is useful for detecting severe aortic stenosis](https://pubmed.ncbi.nlm.nih.gov/27792660/) は弁通過流速のタイミング。圧の最高点とは別。

## 数理的考察（独自考察、正常値のエビデンスではない）

単純な compliant node では C(P) dP/dt = Qin - Qout なので、圧の最大は流入と流出が釣り合う時刻にある。流入が最大の時刻とは異なる。閉ループでは P、Qout、Qin が C と連動するので、「ピーク時刻は C に依存しない」とは言えない。

LV–Ao 圧差を DeltaP(t) と書けば、dPLV/dt = dPAo/dt + dDeltaP/dt。差が小さくても、その時間勾配によって各ピークはずれる。ピークの時間差単独で弁狭窄や不十分な収縮力とは言えない。

二峰性の有無は生理的 augmentation と数値的 ringing を混同しやすい。P1とP2の高さが接近した滑らかな波形では、数mmHgの変化だけで global peak が早期から後期へ飛ぶ。従って global peak phase の狭い gate は、形の小変化へ過敏な採否を作り得る。

ピーク時刻と PV loop の曲率も別物である。流量が不均一なので駆出時間50%と拍出量50%は一致しない。ET後半の最高圧が遅いことは、PV上辺の凹み・flat plateau と一対一ではない。

## 現候補への適用

出典: `artifacts/baseline-candidate-2026-09-06/selected-evidence-final.json`, `fine.shape`。dt=1 ms、forward-flow threshold=max(1 mL/s, 1% Qpeak)。

- LVP global peak elapsed-time fraction: 0.7622641509433877。
- Ao node global peak elapsed-time fraction: 0.8339622641509553。
- 同時刻までの expelled-volume fraction: LVP0.8735687633671956、Ao0.9274767465108127。
- Exact-output AV ET: 268 ms。shapeの分母は閾値内の最初～最後のsampleであり、268 msそのものではない。
- `analysis/methods/mainWire/MainWireEjectionShapeDiagnosticsV1.ts` は first maximum を採用し、clinicalThreshold=null としている。

これらを30–50%という未検証の範囲から外れていることだけで棄却しない。一方、単純な compliance node は実在大動脈の空間的波伝播・反射を同じ形では表していないので、後期優位の正常波形があることだけで機序を認証しない。表示される total pressure の時間形状・流量・圧差・駆出終末を、定義の合う実測例と組み合わせて比較する。

## 推奨する最小限の評価方針

1. 圧ピーク位相は現状の記録・説明用指標として保持。未検証の狭い必須正常 gate は作らない。
2. 比較時は HR、圧振幅、年齢群、圧測定位置、時間起点を揃える。AV flow と LV/Ao pressure を同じ時軸で見る。
3. 最高点だけでなく、第1肩・後期増高の大きさ、ピーク周囲の幅、駆出後半の圧低下を確認。初めから新しい数値 gate を増やす必要はない。
4. 多峰性の許否は実測型との整合性と数値再現性を区別して判断する。小さな肩や生理的な第2波を一律に消す fitting は避ける。
5. 現候補の採否は既存の循環・弁・収縮弛緩・preload reserve の総合評価で行う。今回の文献調査のみで採用・棄却、Zc/L/Ca の変更はしない。

## 検索範囲と限界

ヒト LVP micromanometer/catheter、ascending aortic pressure-flow、time to peak pressure、first/second systolic peak、ejection-normalized timing、normal controls、healthy aging を中心に、引用文献から原著を追跡した。動物・計算モデル・Doppler AT/ET・ECG起点・模式図を識別して除外／別記した。これは広範な叙述的調査であり、網羅的なシステマティックレビューや個人データメタ解析ではない。一部の全文は取得できず、abstract確認であることを明記した。正常 LVP global peak/ET の年齢・性・HR別95%参照区間は今回見つからなかったが、存在しないと証明したわけではない。

## 追補: LV PV loop の形状

### 要点

今回の実測文献を踏まえると、**「正常なら上辺全体が中央の膨らんだドーム状でなければならない」という前提は修正すべき**である。平坦に近い正常対照例も、最高圧が左上・駆出終末側に寄る正常対照例もある。ただし、それは元の Standard70 の再上昇を正常と認定する根拠ではない。後期増高、曲率の変化、閉鎖付近の鋭いスパイク、繰り返す振動は分けて評価する。

| 問い | 今回の判断 | 根拠の限界 |
| --- | --- | --- |
| 最高圧はPV上辺の中央に必要か | 必須とする根拠なし。左側に寄った正常対照の実測例がある | 図の一例から正常位置の分布は作れない |
| 上辺が比較的平坦なら異常か | それだけでは異常といえない | 厳密な長い一定圧・不自然な角・数値クリッピングまで容認する意味ではない |
| 駆出後半の一部が下に凸なら異常か | 曲率符号だけでは判定できない | 圧と流量の時間経過を併せて調べる必要がある |
| 二峰性はすべて除去すべきか | 肩・後期増高と ringing を区別する | 正常ヒトLVの二峰性振幅・持続時間の参照区間は得られなかった |
| AV close付近の再上昇は正常か | 生理・測定アーチファクト・モデル由来を鑑別すべき | Ao切痕や心音を、そのままLVの大きな再上昇の根拠にしない |

表の実測根拠は以下A-C、測定上の注意はD-E、曲率に関する根拠は後述の独自導出に対応する。

### A. ヒトの同時侵襲計測で確認したPV形状

#### Kelly et al., Circulation 1992

[Effective arterial elastance as index of arterial vascular load in humans](https://doi.org/10.1161/01.CIR.86.2.513)。Methods、Results、Figure 1（誌面516、PDF4ページ）を確認し、ページ全体をレンダーして視認。

10人のカテーテル研究。若年正常血圧4人（21±3歳）と高血圧6人（41±9歳）で、LV圧・conductance容積・上行Ao圧流量を同時に200 Hzで記録した。Figure 1の正常血圧例は上辺の圧変化が小さく、著者も四角に近い形と説明する。一方、高血圧例は駆出後半ほど高圧となる台形に近い。**正常上辺に強いドームを必須とすることへの直接的な反例**である。選択された少数の対照・代表図であり、一般健常者の形状頻度は分からない。なおMethodsの群記号と図の記号に入れ替わりがあるため、ここでは年齢・血圧で識別する。

PDF原本（変更なし）: :codex-file-citation{path="/tmp/lv-pv-shape-research.BCmJ5Q/kelly1992.pdf" purpose="source"}

#### Karamanoglu & Kovács, Biomedical Engineering Online 2004

[Thermodynamic phase plane analysis of ventricular contraction and relaxation](https://doi.org/10.1186/1475-925X-3-6)。Methods、Table 1、Figure 5（PDF7ページ）を確認し、図を視認。

18人のうち、正常・弛緩障害・心不全を各6人として比較。LV micromanometerとconductance容積を200 Hzで同時記録。正常群はEF>60%、τ<50 ms、LVEDP<12 mmHgで定義され、年齢53.5±7.6歳。Figure 5左の正常例では、最高圧が上辺中央ではなくESVに近い左側にある。目視から細かな百分率は算出しない。代表図の微細な突出まで生理的と認証するものではない。この図は実測形状の資料として使用するが、論文独自の熱力学的指標・Ca動態の解釈まで本モデルに採用するものではない。

PDF原本（変更なし）: :codex-file-citation{path="/tmp/lv-pv-shape-research.BCmJ5Q/karamanoglu2004.pdf" purpose="source"}

前半で扱ったMurgo JCI 1980 Figure 1は正常対照のLVP/AoP/流量の同時記録であり、この2報とは異なりPV図そのものではない。圧の時間ピークが後半にあることは示せても、その図だけからPV上辺の容積座標や細かな凹凸までは決められない。

### B. 負荷・収縮弛緩・ピーク定義に関する原著

#### Iketani et al., Japanese Circulation Journal 1998

[The Influence of Changes in Loading Patterns on Left Ventricular Relaxation in Humans](https://doi.org/10.1253/jcj.62.581)。Methods、Table 1、Figure 1（PDF2ページ）を確認し、図を視認。

20人、55±14歳。梗塞10人などを含み、正常値集団ではない。LV/Ao micromanometer計測で、心房ペーシングによりHRをほぼ70に維持し、angiotensinとnitroglycerinを比較。Figure 1で後期圧増高の変化を確認でき、弛緩時定数も負荷条件とともに変化する。Table 1の最高圧時刻はECG-R起点で、駆出開始起点ではない。また駆出終末の代理に最小dP/dtを使っており、画像上のAV完全閉鎖と同一視しない。薬剤が前負荷等にも作用するため、純粋な単一後負荷因子の実験とも扱わない。

PDF原本（変更なし）: :codex-file-citation{path="/tmp/lv-pv-shape-research.BCmJ5Q/iketani1998.pdf" purpose="source"}

#### Fok et al., Hypertension 2014

[Augmentation pressure is influenced by ventricular contractility/relaxation dynamics](https://pubmed.ncbi.nlm.nih.gov/24516104/)。DOI 10.1161/HYPERTENSIONAHA.113.02955。Abstract確認。

カテーテル検査30人、61±13歳でAo圧・流量を同時計測。全身投与に加えて冠動脈内nitroglycerin投与を比較し、後期増高の減少は反射だけでなく心室の収縮弛緩動態にも関係すると報告。後半の山を見て「反射だけ」「血管だけ」「Caだけ」と断定しないための機序資料であり、正常LV PV形状の分布ではない。

#### Senzaki, Chen & Kass, Circulation 1996

[Single-beat estimation of end-systolic pressure-volume relation in humans](https://pubmed.ncbi.nlm.nih.gov/8921794/)。DOI 10.1161/01.CIR.94.10.2497。Abstract確認。

正常または心筋疾患87人を対象とするsingle-beat推定研究。正規化elastance曲線の時間起点・最大elastanceへの正規化を扱う。報告された収縮初期25-35%での小さい変動は、LVP最高圧がETの25-35%に必要という意味ではない。Emax、Pmax、AVCを同じ時点としてPV形状の閾値を組み立てない。

#### Nonogi et al., British Heart Journal 1988

[Diastolic properties of the normal left ventricle during supine exercise](https://pubmed.ncbi.nlm.nih.gov/3408616/)。DOI 10.1136/hrt.60.1.30。Abstract確認、原本PDFは取得できず図は未確認。

正常LV9人のmicromanometerとbiplane ventriculographyによる安静・運動比較。運動時にはESV、最低LV圧、τが低下し、SV・充満速度等が変化する。正常心も単一の固定PV輪郭を持つわけではないことの補助資料。ただし運動データを安静baselineの形状基準に混ぜず、駆出上辺の曲率正常値としては使用しない。

### C. 「正常者のPV図」でも、形を観測したとは限らない

#### Pedrizzetti et al., WASE, EHJ Cardiovascular Imaging 2025

[Noninvasive assessment of left ventricular performance using pressure-volume loops, blood propulsion and strain tensors](https://doi.org/10.1093/ehjci/jeaf196)。MethodsのPressure-volume loops節を確認。

正常1,403人の3D echoを用いる大規模研究だが、LV圧の直接記録ではない。圧・容積の制約点からPV図を再構成し、**収縮期の上辺を所定の最高圧を持つ放物線として置いている**。従って、掲載図がドーム状であることは独立した生理学的検証にならない。これは研究全体の有用性を否定するものではなく、推定される大域的指標と、モデルに組み込まれた細部の形状を区別するという意味である。

#### Sjöberg et al., Clinical Physiology and Functional Imaging 2021

[Non-invasive quantification of pressure-volume loops from cardiovascular magnetic resonance at rest and during dobutamine stress](https://doi.org/10.1111/cpf.12718)。Abstract確認。

ヒト対照16人ではCMRと上腕血圧を用いた推定PVで、侵襲的比較はブタ8頭。ヒトの正常上辺をカテーテルで直接観測したデータとして数えない。非侵襲推定の妥当性と、数ms単位のAV閉鎖付近の形状の再現性は別の検証課題である。

また、[ESC 2021の5点再構成法の抄録](https://esc365.escardio.org/journal/8559)には、最高圧を拍出容積の中間点に配置する方法がある。これは実測から得た「正常ピークは上辺中央」という知見ではなく、再構成上の仮定である。模式図、圧テンプレート、容積の低時間分解能を平滑化した図も、閉鎖付近の再上昇・二峰性の正常基準には使わない。

### D. AV close付近の再上昇・二峰性をどう区別するか

ここでいう「再上昇」は、単なる変曲点ではなく、時間方向に圧が一旦低下した後で上昇することを指す。「左上に山がある」だけでは再上昇を意味しない。

| 分類 | 調べる特徴 | 解釈上の注意 |
| --- | --- | --- |
| 駆出中の滑らかな後期増高 | 順行性流量が残る間の肩・広い第2波 | 正常対照にも後期優位圧波形はあるが、原因は輪郭だけでは同定できない |
| 閉鎖関連の短い圧変動 | 流れの減速・逆転・閉鎖との時間関係、持続時間 | 心音帯域の変動と、上辺を変形する大きな第2山は別物 |
| カテーテル等の測定アーチファクト | 収縮末期の鋭い突出、センサー位置や計測系との関係 | 論文の実測図にあることだけで生理的とはいえない |
| シミュレーション由来 | dt、収束、弁イベント、張力・流量との位相関係 | 数値誤差と、連続モデル自体の不適切な力学の双方を考える |

#### Bacmeister et al., Frontiers in Cardiovascular Medicine 2019

[Assessment of PEEP-Ventilation and the Time Point of Parallel-Conductance Determination for Pressure-Volume Analysis Under β-Adrenergic Stimulation in Mice](https://doi.org/10.3389/fcvm.2019.00036)。Results/Discussionのend-systolic pressure-spikes節とFigure 5（PDF10ページ）を確認し、図を視認。

マウス23頭中6頭でβ刺激中に収縮末期圧スパイクを認め、Figure 5ではPV左上に鋭い突出がある。著者はセンサーと乳頭筋・心室壁の接触を有力な機序としている。これは**ヒト正常形状の証拠ではなく、実測でも偽の再上昇が生じ得る証拠**である。モデルにはカテーテルがないため、現モデルの再上昇原因をこの機序で説明することもできない。

PDF原本（変更なし）: :codex-file-citation{path="/tmp/lv-pv-shape-research.BCmJ5Q/bacmeister2019.pdf" purpose="source"}

#### Tamborini & Gharib, Scientific Reports 2024

[Listening to heart sounds through the pressure waveform](https://pmc.ncbi.nlm.nih.gov/articles/PMC11538537/)。DOI 10.1038/s41598-024-78554-5。本文の測定法・Resultsを確認。

カテーテル記録とcuffから抽出した振動成分を比較し、駆出開始・終末に関連する2つのwave packetを扱う。解析対象71人は高血圧等の多い臨床集団で、正常PV形状の集団ではない。主な評価量は抽出された音圧・振動成分であり、LV PV上辺の大きな再上昇の正常幅ではない。生体に振動成分があることと、0Dモデルが大きな閉鎖時humpを持つべきことは同義ではない。

#### 現時点の結論

**正常ヒトLVについて、AV閉鎖前後の再上昇を何mmHg・何msまで正常とするか、あるいは二峰性を一律禁止するかを決められる直接データは今回得られなかった。** 原著の後期増高を、AV閉鎖後の大きなLV再加圧の証拠に読み替えない。大動脈切痕とLV圧の再上昇も、測定部位・発生機序を分ける。

本調査では元のStandard70を再実行・再解析していない。過去の再上昇が、どの弁イベントの前後に、どの圧定義で生じていたかは未確定である。「旧モデルも正常」「旧モデルはLが原因」といずれにも結論しない。

### E. 比較する測定量と、上辺以外の形状

#### 計測系の違い

[Machado et al., Left Ventricular and Aortic Pressures Measured With Fluid-Filled and Solid-State Pressure Catheters, 2025](https://jdc.jefferson.edu/cardiologyfp/172/)。DOI 10.1155/joic/9359365。著者所属機関公開のAbstract確認。18人の同期比較では、fluid-filledによる収縮期圧がsolid-stateよりLVで6.6±6.9、Aoで4.6±5.2 mmHg高かった。これはピーク時刻や曲率の補正係数ではないが、「カテーテル波形」を計測特性の同じ一種類として扱えない具体例である。

比較時には圧センサー、帯域・フィルタ、PとVの時間同期、容積校正、呼吸・外圧、単拍か平均拍かを残す。特にPVの丸い角は圧と容積の相対時間ずれでも変化し得る。元データを得ていない図から、その原因や数msの遅延を逆推定しない。

#### 現webappとの圧定義の差

現在の[PV解析実装](../../analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3.ts)はLV/RVともtransmural pressureを使う。一方、通常の心室内カテーテルは心室内圧を測る。

\[
P_{\mathrm{LV}}(t)=P_{\mathrm{tm}}(t)+P_{\mathrm{ext}}(t).
\]

外圧が一定なら上下の平行移動に留まるが、時間変化すればピーク時刻も曲率も変わり得る。現候補の既存LVPピーク位相は心室内圧由来であり、そのまま表示PVのtransmural最高点の位置として読まない。カテーテル文献との比較には心室内圧PVを併記し、transmural PVを別目的として保持するのが自然である。今回は表示・出力を変更していない。

#### 上辺以外も固定した「正常の輪郭」にしない

- 右側の収縮と左側の弛緩が概ね等容性になることは、弁流量と容積保存の問題。実在する逆流を含む症例を正常の四角へ強制しない。局所壁運動の変形は、必ずしも全LV容積の変化を意味しない。
- 下辺は一拍中の動的な充満軌跡で、静的EDPVRそのものではない。活動性弛緩・外圧が変化するため、容積が増える間に圧が低下する区間があっても、直ちに受動的な負の剛性とは解釈しない。
- 左上の角は「最小容積」「最大elastance」「最大圧」「順行性流量消失」「AV完全閉鎖」を同一の点と仮定しない。文献によってend-systoleの定義も異なる。
- 図の縦横比を変えると見た目の膨らみは変わる。圧・容積軸を揃えた実単位図と、定義を明示した正規化図を使う。ただし正の線形スケール変換自体は極値数や曲率の符号を変えない。

これらは主に計測定義と保存則に基づく解釈で、正常輪郭の集団統計を追加したものではない。

### F. 数理的考察: 平坦・変曲・二峰性は同じものではない

以下は独自導出であり、文献の正常範囲ではない。まずMVが閉じ、逆流や他の流出入がない順行性駆出区間に限定する。流量を \(Q=Q_{\mathrm{AV}}>0\) とすると、\(\dot V=-Q\) なので、

\[
\frac{dP}{dV}=-\frac{\dot P}{Q},\qquad
\frac{d^2P}{dV^2}=\frac{\ddot P Q-\dot P\dot Q}{Q^3}.
\]

従って、PV上辺の曲率は圧の時間的な曲がり方だけでなく、流量の減速・加速にも依存する。駆出後半に一部が下に凸（この座標で二階微分が正）でも、必ずしもP(t)に再上昇があるわけではない。逆に、容積が単調減少する区間では、時間から容積への座標変換は圧の極値を新たに作らない。**本当の二峰性と、単一峰の曲率変化は分けられる。**

Qがゼロへ近づく閉鎖の角ではこの表現は悪条件となり、等容性区間ではPをVの一価関数として扱えない。そこで二階微分や曲率の狭い正常gateを作るのは不適切。生理的な小流量・長い時間区間がPV横軸では非常に短くなることにも注意する。

説明用に、受動圧等を省略した \(P=E(t)(V-V_0)\) を考えると、

\[
\dot P=\dot E(V-V_0)-EQ.
\]

活性化に伴う圧上昇と容積減少による圧低下が釣り合えば、クリッピングがなくてもplateauに近づく。Pの最大時には、Q>0なら \(\dot E/E=Q/(V-V_0)>0\) であり、この単純化ではEはまだ増加中である。これは最高圧とEmaxを同一視できない説明であって、現在のLand/five-wall系の構成式への置き換え提案ではない。

また、PV一周の正の外部仕事 \(-\oint P\,dV\) は上辺全体がドームであることを要求しない。一拍中の軌道の傾き \(dP/dV\) を、同じ時刻・状態での受動剛性やESPVRの傾きと混同しない。

### G. 現モデルを評価するための最小限の方針

この節は次の解析に向けた提案であり、今回実装・再fittingはしていない。

1. **まず定義を揃えた一拍を重ねる。** LV心室内圧とtransmural圧、表示AoPと比較に必要なnode圧、AV流量、容積、AV開放・閉鎖イベントを同一時間軸で確認する。旧Standard70、現候補、同一構成の低/高preloadを区別する。過去のスクリーンショットだけで因果関係を決めない。
2. **ピークは時間と容積の2座標で記録する。** \(\phi_t=(t_{\max}-t_{\mathrm{AVO}})/ET\)、\(\phi_V=(V_{\mathrm{AVO}}-V(t_{\max}))/(V_{\mathrm{AVO}}-V_{\mathrm{AVC}})\)。後者は右端0・左端1。既存の閾値内サンプルを使う値は真のAVイベント定義と区別する。ほぼ等高の山やplateauではargmaxだけでなく周辺幅も示す。
3. **再上昇をイベントに関連付ける。** 谷から次の山までの圧上昇量mmHg、持続ms、駆出容積比、閉鎖前/後、順行性流量の有無を記録する。外見の曲率不足、広い第2波、単発スパイク、複数回ringingを別名で扱う。
4. **既存診断の盲点を把握する。** [shape診断](../../analysis/methods/mainWire/MainWireEjectionShapeDiagnosticsV1.ts)の `maximumPostPeakReboundMmHg` は最初のglobal maximum以降だけを測る。後期第2山が最高点になる波形では、前の谷からそこまでの再上昇を捕えない。ゼロという結果だけで二峰性や途中の再上昇がないとはいえない。別のpeak-countもあるが、両者の定義を混同しない。
5. **数値品質とモデルの妥当性を分ける。** dtを細かくして振幅・時刻が収束するか確認する。収束すれば離散化アーチファクトの疑いは減るが、過小減衰の循環回路や不適切な張力応答を持つ連続モデルも収束する。dt収束だけで生理的とは認証しない。Lが候補でも、張力、短縮速度、残存活性化、外圧、弁イベントとの関係を確認してから限定したablationを行う。
6. **形状は当面、記述的評価に留める。** 中央ピーク・単峰・正のbowを根拠なく必須条件にしない。正常波形であり得るplateauや肩を消すためにCa/Landを動かすことは避ける。一方、数値破綻、大きな不連続、不適切な逆流・容積変化は「正常値の幅が不明」という理由で放置しない。

ユーザーの「低TBVではきれいで、高TBVで再上昇が強い」という観察は重要な負荷依存の手掛かりである。ただし低容量波形が生理的な正解とは限らず、高容量で形が変わる理由もTBV過剰・心筋異常のどちらかに即決できない。急性IVC遮断と、固定制御下で定常化したTBV変更は同一の負荷プロトコルではない。

私の現時点の判断は、**ドーム化自体を目的にせず、終末の再上昇が「どの力学・どのイベント・どの時間幅」で生まれるかを優先する**こと。現候補の遅い最高圧を位置だけで棄却する理由は弱まったが、元のStandard70の再上昇の妥当性が証明されたわけではない。

### H. 検索を広げた追加原著: PV全体の変形と定量化

以下では、上辺の見た目に限定せず、容積方向の移動、等容性区間、下辺、局所と全心室の違いを調べた。本文・図説明を読んだ資料と、原本図を視覚確認した資料は同じ扱いにしない。ここに追加する原著図の細部は新たにdigitizeしていない。

#### H1. Kohli & Kovács 2017: 正常者の正規化PVと充満・駆出の位置

[The quest for load-independent left ventricular chamber properties: exploring the normalized pressure-volume loop](https://pubmed.ncbi.nlm.nih.gov/28351966/)。Physiological Reports 5:e13160、DOI 10.14814/phy2.13160。Abstractと本文の正規化の説明を確認、原本図の視認は未実施。

正常対照13人・161拍の高忠実度PVを、圧の範囲0-1、容積をdiastasis時の容積で正規化。最大充満速度時の容積比は0.64±0.05、最大駆出速度時は0.81±0.09と報告した。前者では拍間変動が小さくなったが、後者ではならなかった。**この0.81は最高「圧」の位置でも、既に駆出したSVの割合でもない。** 161拍を161人の独立標本として扱わず、小さな自然変動での安定性を広い負荷範囲での不変性と読み替えない。正規化の工夫は有用だが、これだけでbaselineの形状gateにはしない。

#### H2. Lieberman et al. 2006: cycle efficiencyとペーシング

[Ventricular Pacing Lead Location Alters Systemic Hemodynamics and Left Ventricular Function in Patients With and Without Reduced Ejection Fraction](https://pubmed.ncbi.nlm.nih.gov/17045900/)。JACC 48:1634-1641、DOI 10.1016/j.jacc.2006.04.099。Methods、Results、Figures 1/4の説明を確認、原本図の視認は未実施。

31人（EF≥40%の17人、EF<40%の14人）で、micromanometer/conductanceにより各ペーシング位置を比較。全LVと局所のPV変形を評価し、cycle efficiencyを \(CE=SW/(\Delta P\,\Delta V)\) とした。外接長方形に近いほどCEは高いが、著者も後負荷・剛性等の影響を認める。これは正常集団のドーム形状の基準ではなく、EF≥40%群を健常者群と扱うこともできない。全LVのCEが似ていても局所PVの変形は異なり得る。

#### H3. Reil et al. 2024: Takotsuboの局所PVと全体PV

[Regional mechanical dyssynchrony and shortened systole are present in people with Takotsubo syndrome](https://doi.org/10.1038/s43856-024-00641-5)。Communications Medicine。Methods、Results、Figure 1/2の説明を確認、原本図の視認は未実施。

conductanceカテーテルの5分節を解析。主要な局所解析はTTS22人・対照14人（元の登録/確定集団とは別）。局所の最小容積時刻の分散やinternal flowが増え、AV閉鎖後でも局所同士の容積移動が続き得る。全心室容積は等容性でも局所は等容性でない。対照は症状があり冠動脈疾患を疑って検査した患者で、年齢やβ遮断薬使用も一致せず、著者も対照のinternal flowの高さに言及する。正常輪郭の分布や、全LVの二峰性が同期不全を意味する証拠にはしない。

#### H4. Kass et al. 1990: 虚血で下辺が上がる理由は単純なstiffnessだけでない

[Influence of coronary occlusion during PTCA on end-systolic and end-diastolic pressure-volume relations in humans](https://doi.org/10.1161/01.CIR.81.2.447)。Circulation 81:447-460。[著者所属機関のAbstract](https://pure.johnshopkins.edu/en/publications/influence-of-coronary-occlusion-during-ptca-on-end-systolic-and-e-3/)確認、原本図は未確認。

10人でconductance/micromanometer、60-90秒の冠動脈閉塞、IVC遮断を比較。虚血時にはESPVRが右へ移動し、弛緩が遅れ、安静拍の拡張期PVは上へ移動した。一方、IVC遮断中の多拍から得たEDPVRには対照との差が小さく、著者はRV・心膜による負荷の影響を重視した。**一拍の下辺が上がったことだけで、受動的な心筋剛性を上げてfittingするのは危険**という具体例である。これは全ての虚血で心筋stiffnessが不変という主張ではない。

#### H5. Nagueh et al. 2025: primary MRとM-TEER

[Understanding the Effects of Mitral Transcatheter Edge-to-Edge Repair on Left Ventricular Function Using Pressure-Volume Loops](https://doi.org/10.1016/j.jacadv.2025.101627)。JACC: Advances 4:101627。Methods、Results、Figure 1の説明を確認、原本図の視認は未実施。

primary MR22人と正常機能の心移植後17人のconductance PV。MR群はLV容積・拡張期圧が高く、治療後は逆流量・充満圧等が低下し、forward COが増加した。対照は除神経に伴うHR差もあり、一般健常baselineの代用ではない。重要なのは、著者が重症MRでは真の等容性弛緩がないためτを治療後にのみ測定した点。輪郭・計測可能な区間は病態によって変わるので、正常のICT/IRTや四角さをMRへそのまま要求しない。

#### H6. Seppelt et al., online 2020 / issue 2022: TAVI直後のPVと平均図の限界

[Early hemodynamic changes after transcatheter aortic valve implantation in patients with severe aortic stenosis measured by invasive pressure volume loop analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC8789710/)。PMID 33313960。Methods、Results、Figure 1説明を確認、原本図の視認は未実施。

AS8人、平均81.3歳、自己拡張型TAVIの前後で侵襲PVを記録。直後はEFや収縮・弛緩指標が一様に改善せず、急性手技と慢性逆リモデリングは別であった。さらに掲載の平均PVは各loopの4区間から各10点を画像読み取りし、平均点を結んだもの。**元が侵襲計測でも、その平均図の滑らかさやAV閉鎖付近の細部は生波形の証拠ではない。** 本文のτ説明にも指数時定数と半減時間を混同する記述があり、定義を無検証でregistryへ移さない。ただし、説明文の問題だけから実際のソフトウェアも誤ったτを算出したとは断定できない。

#### H7. Redington et al. 1988 / 1990: RVとの比較から分かる負荷の重要性

[Characterisation of the normal right ventricular pressure-volume relation by biplane angiography and simultaneous micromanometer pressure measurements, 1988](https://pubmed.ncbi.nlm.nih.gov/3342146/)。DOI 10.1136/hrt.59.1.23。Abstract確認。

正常冠動脈・血行動態の成人10人でbiplane RV angiographyと同時micromanometerを使用。正常RVのPVはLVの四角に比べ三角に近く、圧上昇・低下中にも駆出が続き、等容性区間を明瞭に定義しにくかった。LVとRVの左上が違うこと自体を、構成式の不統一・実装漏れの証拠にはできない。

[Changes in the pressure-volume relation of the right ventricle when its loading conditions are modified, 1990](https://doi.org/10.1136/hrt.63.1.45)。Abstract確認。

RV圧負荷ではLVに近い輪郭となり、圧負荷解除後には変化した。一方、Mustard術後の肺循環側LVは正常RVに近い輪郭を示した。心筋の名称だけでなく、接続する負荷が形状を左右するというヒトの比較資料。ただし先天性疾患・術後の観察であり、LV/RVの心筋特性を完全に同一と証明したものではない。両心室を同じ輪郭gateに揃える根拠にもならない。

#### H8. Wei et al. 2014: 中盤の低下と終末の再上昇が位置調整で消える実験

[Use of Pressure-volume Conductance Catheters in Real-time Cardiovascular Experimentation](https://pmc.ncbi.nlm.nih.gov/articles/PMC4241179/)。Heart Lung and Circulation 23:1059-1069、DOI 10.1016/j.hlc.2014.04.130。Methods、Results、Figures 1-3の説明を確認、原本図の視認は未実施。

麻酔ラットのdobutamine実験。駆出中盤で圧が低下し終末に上昇するPV変形が現れ、カテーテル回転・位置調整で改善した。Echoで乳頭筋付近のセンサー接触を確認し、動脈圧が変わらないのにLV圧だけが上がる例も報告。前述のマウス報告に加えて、測定アーチファクトを具体的に裏付ける資料である。ただし、ヒトの滑らかな後期増高までアーチファクトと決めつけない。モデルで同じ見た目が生じても原因は別に調べる。

### I. 形状指標の使い分け: 一つの「ふっくら度」へ集約しない

| 指標・表現 | 分かること | この目的での限界 |
| --- | --- | --- |
| 圧ピークの時間位相・駆出容積位相 | 最高圧がいつ、どれだけ駆出した位置にあるか | 等高ピークで飛ぶ。圧と流量のピークを区別する |
| 谷から次峰への圧増加、時間幅 | 実際の再上昇の大きさと時間尺度 | 生理・構造・数値原因を単独で同定しない |
| 上辺のchord residual / bow | 選んだ容積区間での弦に対する膨らみ・凹み | 区間依存。正常参照区間は未確立 |
| cycle efficiency = SW/(ΔPΔV) | loop全体の外接長方形への面積充足率 | 四角に近いほど高い。ドーム指標でも、酸素消費からの効率でもない |
| SW/PVA | 選んだESPVR/EDPVR法での仕事配分 | 曲率・二峰性の位置を失う。cycle efficiencyとは別物 |
| 正規化PV / pressure phase plane | 振幅差を除いた形・圧変化速度の比較 | 正規化しただけでload-independentにはならない |
| 局所PV、internal flow、位相差 | 心室内の不同期・無効な容積移動 | 全心室PVの形だけから復元できない。現0Dの表現範囲とも照合が必要 |

cycle efficiencyの式はH2の原著に基づく。その他の比較上の長所・限界は、本調査での定義整理・独自考察である。

仮に上辺を平坦からドームへ変えれば、同じ外接長方形でも面積は小さくなる場合がある。従って「CEを最大化」と「ドームを強める」は同じ最適化問題ではない。CE、SW/PVA、形状の滑らかさを同時に「心機能の良さ」と呼ぶと、相反する要求をbaseline fittingへ入れてしまう。

また、PとVの軌跡だけでは速度情報が失われる。同じ幾何学的PV輪郭を、異なる時間配分で一周することは可能で、ETや±dP/dtは変わり得る。PVの見た目が合っていても時間動態の検証にはならず、逆にETが合っていてもPV形状の検証にはならない。これがP(t)、V(t)、Q(t)を同時に確認する理由である。

### J. baseline / 症例表現へ使うときの結論

- 正常baselineは、定義を揃えたヒト実測と循環・収縮弛緩・負荷応答を合わせて評価する。中央ドームの「理想図」を唯一の正解にしない。
- ASでは弁前後圧とflow、MR/ARではforwardとregurgitant flow・真の等容性区間を重視する。単に高く狭い/広い/三角という教科書的変形だけで病態を判定しない。
- 虚血・HF・同期不全では、上辺だけでなく容積軸位置、下辺、時間経過、局所と全体の区別を残す。形だけからCa、Land、TBV、stiffnessの変更先を決めない。
- RVの輪郭をLVへ揃えない。共通の物理法則を使うことと、異なる負荷でも同じ形を作ることは別である。
- registryへ文献を付ける際は、直接実測/再構成/模式図、正常対照の条件、測定位置・時間起点・圧定義を付記する。論文が一つあることだけでは、その数値や輪郭を必須gateにする妥当性は保証されない。

現時点では新しいshape hard gateや新規fitting機構の増設は推奨しない。まず既存traceで、終末の再上昇の振幅・幅・弁イベントとの関係と、心室内圧/transmural差を読み解くのが最小で情報量の多い次の作業である。後負荷試験の再導入やモデル変更を今回の文献調査から自動的に実行するものではない。

### 追補の検索範囲・未解決点

検索語はhuman/invasive/conductance pressure-volume loops、normal controls、square/trapezoidal/dome、late systolic pressure、aortic valve closure、end-systolic pressure spike、biphasic pressure、catheter entrapment、non-invasive PV reconstruction等。追加してnormalized PV loop、cycle efficiency、rectangularity、regional dyssynchrony、Takotsubo、ischemia/PTCA、MR/TEER、AS/TAVI、RV loadingを検索した。圧・容積の同時計測原著を優先し、負荷変更、疾患、動物、機械弁simulator、推定波形を別分類した。Kelly 1992、Karamanoglu 2004、Iketani 1998、Bacmeister 2019は上記の原本図を視覚確認した。本文・図説明のみ/Abstractのみの追加資料は各項に明記した。図から新たな数値をdigitizeして正常閾値を作る作業はしていない。

得られなかったものは、正常ヒトの年齢・HR・負荷条件別のPV最高圧容積位相、駆出後半の曲率、閉鎖付近の再上昇振幅/時間、二峰性の頻度についての、測定定義が一致した参照区間である。小規模対照の代表図は単一の理想形を否定する材料にはなるが、広い正常分布や本モデルの全症例表現を検証する材料としては不足する。以上は叙述的調査であり、「普遍的正常形がない」と完全に証明したシステマティックレビューではない。

## 実装への反映（2026-09-07）

[生理評価の再点検とτ追加](../physiology-evaluation-2026-09-07/REPORT.md)に全41チェック群の採択判断、方法の違い、残す設計目標、新しい局所再上昇観測、τの定義・品質・保存データ再解析を記録した。v3では体積流量E/Aとhydraulic ICT/IRT/Teiの8項目を参考化したが、ET/圧/容量/EF/CI/SVIの設計目標は残している。正常分布を捏造するような閾値の拡大や新しいドーム形状gateは行っていない。

Weiss τは候補2ms/1msで33.15/32.85ms、Glantz感度推定は55.14/55.45msとなった。刻み感度が小さいことと、方法間の大きな差は別々に解釈する。選択候補の局所駆出中dipとAVC→MVO再上昇は0mmHgだが、mean PAPやevent LVEDP等の作動点の既知課題を消す結果ではない。旧exact modelの採用判断と新しい解析reportは混同せず、modelIDは変更していない。
