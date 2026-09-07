# 生理評価の再点検とτ追加 — 2026-09-07

## 結論・実装範囲

**形状を正常のテンプレートに合わせるのではなく、測定の意味、設計目標、数値・機序上の未解決事項を分ける。** 41既存チェックを全群点検した。数値の上下限は今回変更していない。新しい評価policy v3では、MV/TVの体積流量E/A、LV/RVのICT・IRT・Teiの計8項目を参考扱いに変更した。陽性値・完全で順序の整ったイベント・Teiの算術整合性は保持する。

ET、圧、indexed volume/EF/CI/SVIの16項目は、安静baselineの選択された設計目標として残す。範囲外は「この設計目標を満たさない」であり「生理的に不可能」ではない。基準の妥当性の不足を、単なる名前変更で解消したことにはしない。来歴監査はなおdraft、16項目のgate-specific supportが未確定で、安定版公開の既存ブロックは解除していない。

旧v1/v2 reportの役割は明示的に固定した。新しい解析の追加で、保存済みexact状態、checkpoint、既存採用判断を再解釈しない。exact-modelの方程式・パラメータ・modelIDはこの作業では変更しない。calibration evaluatorはキャッシュ上の旧結果と区別するためv4。追加のτはanalysis所有の補足観測で、exact frameのplaceholderではない。

## 全必須群の判断

以下の数値は**現行実装の選択値**。一つの正常母集団の同時許容域ではない。元論文の対象、観測法、元範囲との対比は `data/physiology/main-wire-normal-reference-evidence-v1.json` の各 `sourceComparisons` に保持している。

|群|現行数値・測定|今回の判断|
|---|---|---|
|定常化|period-1、連続周期の一致|数値品質として必須。正常生理の証明ではない|
|LV/RV駆出中の形状|forward episode 1、significant peak 1、TV ratio ≤2.2|未説明の振動を通さないための現モデルの構成制約を維持。人の正常波形が必ず一峰という主張ではない|
|LV/RV rounded/peak phase|central range .08–.35、sample-index peak phase .2–.8|従来から参考扱い。ドーム・中央ピークの正常分布なし。elapsed time/expelled volume座標の記録を優先|
|AV勾配|raw LV−Ao、forward-flow mean0–5 / peak0–10 mmHg|非狭窄構成の制約として維持。Dopplerや圧回復後のカテーテル差の正常閾値とは称さない|
|AV ET|240–340 ms|主目的の安静baseline設計目標として維持。Copenhagenのcolor-TDI LVET248–336 msと近いが測定同等性は未確立|
|LV ±dP/dt|+1200–2500 / −1400–−700 mmHg/s|参考扱いを維持。特に負側は引用正常対照の平均を除外する暫定帯。小標本mean±SDから新しい厳密正常帯を合成しない|
|MV E/A|体積流量ピーク比 .8–2|v3で参考化。Doppler速度比とは違い、年齢別正常帯とも一致しない|
|LV ICT/IRT/Tei|20–70 /59–134 ms、.29–.65|v3で参考化。hydraulic eventとcolor-TDI/PW/TDIを混同しない。比Teiは独立観測ではない|
|AoP max/min|90–140 /60–90 mmHg|安静作動点の設計目標。中心大動脈・末梢cuffの測定場所の違いがあり、正確な閾値来歴は未確定|
|CVP(mean RA)|1–8 mmHg|作動点目標。ESC/ERS Table11のRAP2–6より広い。ゼロ基準・呼吸相等が異なる|
|PAP max/min|15–35 /4–15 mmHg|作動点目標。Table11の15–30 /4–12より広い。これだけで正常mPAPを保証しない|
|PCWP surrogate|mean LA 4–13 mmHg|作動点目標。healthy PAWPの文献はあるが、mean LAとwedgeは同一の観測演算ではなく、下限4も直接支持されない|
|LV EDVi/ESVi/EF|34–99 /10–40 mL/m²、52–74%|作動点目標。2D/3D echoとCMR、男女・年齢・papillary segmentationの混成帯。1つの正常分布ではない|
|RV EDVi/ESVi/EF|32–87 /8–44 mL/m²、42–82%|同上。3D echo性別union/subgroup極値由来で、CMR正常者をすべて包含しない。RVをLVと同じ形にしない|
|CI/SVI|2.5–4 /35–65|設計目標。CIはTable11と一致、SVI33–47とは不一致。CMR研究との統合は設計選択。HR固定下CI=HR×SVI/1000で独立ではない。逆流時は正方向積分≠net flow|
|PV勾配|raw RV−PA mean0–5 /peak0–10|非狭窄構成制約。AS/PSの臨床正常閾値を根拠にしない|
|PV ET|220–350 ms|安静構成の設計目標として保持。ただし右心のmethod-matched正常根拠は不足し、左ETからの類推では検証できない|
|RV ±dP/dt|+300–1000 /−700–−150|参考扱い。TR由来12/Δtは瞬間最大RVP微分と違う|
|TV E/A|体積流量ピーク比 .8–2|v3で参考化。呼吸平均したDoppler流速比と同一ではない|
|RV ICT/IRT/Tei|20–90 /30–120 ms、.25–.65|v3で参考化。単純にLV基準を移植しない。弁イベントの完全性は必須|
|PAP/PV flow形状|各peak1、episode1、post-closure rebound≤.5 mmHg|未説明の肺動脈再上昇を防ぐ構成制約。人のdicrotic notch正常分布の閾値ではない|
|固定制御preload reserve、左右×低/高容量|TBV±12%。CO/EDV方向変化≥3%、CO/充満圧勾配≥.02 L/min/mmHg等|構成上の最低予備能・非退行余裕として維持。fluid challenge responder基準ではない。充満圧・Ptm応答、枝の定常化を保持。afterload試験を追加しない|

予備能の既存基礎条件には充満圧方向差≥1 mmHg、CO方向差≥.05 L/min、EDV方向差≥1mL、ED Ptm方向差≥.25 mmHg等も含む。これらも正常者の集団閾値ではなく計算プロトコルの応答下限である。

## 形状観測の修正

従来のpost-global-maximum reboundは、「一度下降してから**より高い第2ピーク**」になる場合を見落とす。局所的な下降→再上昇をすべて記録し、落ち込み量・回復量・時間を別々に保存するよう変更した。旧post-global指標も定義を変えず残した。駆出後半のchord deficit、time peak、expelled-volume peakは記述指標のままで、正常の曲率閾値は設けない。

さらにτ解析にはAVC→MVO全区間の再上昇記録を加えた。τの開始点より前や、そのfit終了点より後の再上昇も隠さない。新規baseline reportでは、丸め誤差を超える未説明の再上昇は機序レビュー待ちとする。これは「単調でなければ人の生理として異常」という判定ではない。モデルの新たな圧上昇を正当化する場合は、その機序とレビューを別途提示する必要がある。駆出中の肩・二峰の正常性問題と、閉鎖後の未解決圧挙動を分離する。

## τ：定義、品質、限界

主観測は左室**内圧**のWeiss zero-asymptote法。最小dP/dtを含むaccepted intervalの中点から、次のEDP+5 mmHgに下降する点までを、実時刻でtime-weighted log-linear fittingする。AV閉鎖以後、MV開放より前でなければならない。EDP、開始点、終了点を観測できないときは推定して埋めない。最後のaccepted interval内にある有効な閾値通過は線形補間し、interval全体を捨てない。逆向きも含め、閉鎖中の有意な弁輸送がある場合は適用しない。

感度観測はGlantz型のdP/dt対pressure自由切片回帰。推定漸近圧を明示し、Weissの48 ms目安を流用しない。一次fitの良否と二次fitの良否を分けた。二次fitの不良で一次値を消さない一方、二次の不良値をUIで同等の精度の数値として見せない。

最小支持点数6、長さ15ms、圧下降幅10mmHg、R²および圧残差の制限は、明示された**暫定的な解析利用可能性**条件で、正常生理の閾値ではない。時間刻みやendpointを変えた感度を別に記録する。大きなR²は物理的に正しい漸近値や正常弛緩を証明しない。

48msはASE2025のprolongationの**参考目安**であり、今回値のhard gateにはしない。小さな正値も「正常範囲内」と表示せず、「延長の目安を超えていない」とする。Hirota1980の33±8ms（n=18）はP0/|dP/dt|minの簡略推定であり、今回の回帰の正常区間として使わない。

### 保存済み候補の再観測（モデル変更・再fittingなし）

|条件|Weiss τ|Glantz τ|Glantz漸近圧|Weiss R²|fit終了点を1点短縮した差|
|---|---:|---:|---:|---:|---:|
|HR70、2ms|33.15ms|55.14ms|−25.22mmHg|.99674|.185%|
|同構成、HR70、1ms|32.85ms|55.45ms|−26.35mmHg|.99660|.424%|
|同構成、HR60、2ms|35.01ms|62.87ms|−33.59mmHg|.99670|.295%|

2→1msでWeiss差約.89%、Glantz差約.57%。同構成のhashと出典ファイルhashを記録した。再上昇の新指標は、選択候補の駆出中とAVC→MVOで0mmHgだった。これは調べた候補・条件だけの結果で、旧Standard70全体や全preload条件の免責ではない。

**33ms対55msという方法間差は小さくない。** 漸近圧は観測窓外への外挿であり、実際に左室圧が−26mmHgへ到達するという予測として読まない。時間刻みの安定性と、モデル仮定の妥当性を別の問題として扱う。

またHR60条件の次のLVEDPは19.51mmHg。τだけが延長目安以下でも正常拡張能とは言えない。選択HR70候補にもmean PAP約20.9mmHgがあり、ESC/ERSのmPAP>20という臨床基準との不一致を見逃してはならない。これは0D出力から患者のPH診断を行うという意味ではない。PAP max/min gate通過を「右心も正常」の証明にしない。baselineの最終採用前に、mean PAPとLVEDP・体格/segmentationの選択を含めて作動点を再考する。

## 次の順序

1. この小さな評価変更を固定してから再採点する。形の見た目のためのCa/Land調整や大規模gridを再開しない。
2. 16設計目標のgate-specific evidenceを、同一の年齢/性別/体格/観測法というbaseline reference contextに合わせて詰める。cross-modality unionを正常母集団と呼ばない。引用数を増やすだけでは完了としない。
3. mean PAPとevent LVEDPの既知逸脱は最終採用時の未解決事項。現在の候補を「完全に中央の正常baseline」とは表現しない。
4. 現行評価でbaselineを確定するまでは、既存のpublished reportを新しい基準に書き換えず、τ未評価は未評価と表示する。研究結果をpublished exact identityの検証結果に流用しない。

## 主要資料と来歴

- [PV形状文献調査（先行REPORT）](../pressure-peak-literature-2026-09-07/REPORT.md)：Kelly1992、Karamanoglu2004、Murgo1980、Redington等の侵襲的図・測定条件。ドームや中央ピークの一律正常制約を支持しない。
- [ASE2025 LV diastolic function, section2/Table1](https://www.asecho.org/wp-content/uploads/2025/07/Left-Ventricular-Diastolic-Function.pdf)：τと負荷依存性、48msの臨床context。測定法を比較せずτ単独で診断しない。
- [Hirota1980](https://pubmed.ncbi.nlm.nih.gov/7190882/)：小規模正常対照、平均±SD、年齢関連。方法の限定は上記のとおり。
- [Ohteら CR-19-0094](https://www.jstage.jst.go.jp/article/circrep/advpub/0/advpub_CR-19-0094/_html/-char/en)：Millar/Weiss法による侵襲的検証。診断用比較基準とモデル正常域を混同しない。
- [De Mey2001](https://journals.physiology.org/doi/abs/10.1152/ajpheart.2001.280.6.H2936)：動物・シミュレーションによるzero/free asymptoteのbias–precision tradeoff。今回は方法論のcontextで、ヒト正常値根拠には用いない。
- [ESC/ERS2022 Table11](https://doi.org/10.1183/13993003.00879-2022)：RHCの圧・CI/SVI参考値と観測条件。モデルとの対応限界をregistryに保存。
- [再観測の数値・出典hash](reobserved-candidates.json)、[二刻み感度](tau-numerical-sensitivity.json)、[残る来歴課題](remaining-gate-provenance.json)、[実行コード](reobserve.ts)。
- [Claudeの独立レビュー原文](claude-review.jsonl)：CLI初期化とresultともclaude-fable-5-1、effort max。Astra最終レビュー・採択判断はREVIEW-DECISION.mdに記録する。

これは調査と実装の作業記録であり、モデル全体の独立科学検証や臨床妥当性の認定ではない。

## 続報：参照方法の整合と、充満負荷だけを変える1条件

### 参照値の根拠を増やすことと、採用基準を確定することは別

残る16項目の数値・役割は変更していない。registryには観測条件と資料の確認範囲を追加したが、gate-specific supportはなお16項目とも未確定である。

- **LV/RVの容積・EFは同じmodalityとsegmentationで比較する。** SCMR2025のMethods、LV/RV各section、Tables2/3/8/9を確認した。解剖学的な血液腔（papillary/trabeculaeは心筋側）を比較するならTables2+8が対応する。モデルの幾何形状が滑らかであることは、画像上のsmooth contour内に心筋組織を血液として含める根拠ではない。ただしモデルと画像の対応自体は未検証。[SCMR2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12159681/)
- **同じ研究の左右心室を比較できる一次データも確認した。** HHC2024著者公開のTable37（White男性）とTable7（White女性）のanatomical/BSA表を、見出し・年齢列・単位・各変数Nを含めて全ページ視認した。40–49歳男性のLV/RV EDVIは51–102/61–118、女性は49–88/53–97 mL/m²。この違いは、性別を後付けして候補を通してはいけない理由でもある。原著全文は未確認で、確認範囲は著者公開表と書誌情報。[HHC tables](https://healthy-hearts.org.uk/tables/)、[原著](https://doi.org/10.1016/j.jcmg.2024.01.009)
- **BSA1.9から性別・年齢・民族を推定しない。** 現モデルはsex-neutralな合成形状であり、過去の体積が男性に近いというだけで男性の特定年齢層に変更しない。私の推奨は、当面は同じCMR方法の男女別値を並列表示し、将来の明示的な設計envelopeが必要なら同方法のsex-unionを工学的選択として宣言すること。これは単一集団のjoint正常域ではない。
- **RHC Table11を一次PDFで確認。** RAP2–6、PAP15–30/4–12、mean PAP8–20 mmHg、CI2.5–4.0、SVI33–47。PAWPは≤15であり「6–12」とは記載されていない。RHCのゼロ位置・呼気終末・CO測定法も確認した。これらは新たな健常者コホートそのものではなく、モデルのmean LAを測定PAWPに変換するものでもない。[ESC/ERS2022原文PDF、Table11・RHC section](https://www.sppneumologia.pt/uploads/subcanais2_conteudos_ficheiros/gidelines-2022.pdf)
- **CI/SVIの測定場所も修正。** Carlsson2012のCMR flowは肺動脈分岐の高さの上行大動脈で、冠動脈起始より遠位。論文は冠血流3–5%によるQp/Qs差を考察している。「逆流がゼロならAoV流量と同一」とする説明は不十分である。netとforwardを区別することも必要だが、それだけでは測定平面の差は消えない。[Carlsson2012 Methods・Discussion](https://link.springer.com/article/10.1186/1532-429X-14-51)

一次PDFを保存した：[ESC/ERS](references/esc-ers-2022.pdf)、[HHC Table37](references/hhc-table37.pdf)、[HHC Table7](references/hhc-table7.pdf)。引用表があるだけで既存の混成上下限を検証済みにはしない。

### 同じ拍の圧・流量を分解する、小さなanalysis追加

`MainWireBaselinePressureFlowReadbackV1`を追加し、研究runnerの最終観測に組み込んだ。既存の保存結果43件を再読込し、観測可能40件、未観測3件をそのまま記録した。新たな定常化は不要だった。

観測は、native MV closure時のLVEDP（内圧/Ptm/外圧）、mean PA/PVein/LA/RA、AoV/PVのsigned netとforward流量、および同じ拍の圧差/肺動脈net flow。欠測を最大圧などで補わず、流量が非正の場合は抵抗様の商を出さない。圧差/流量は**実効的な負荷の記述**であり、primitive resistanceの同定や臨床PVRではない。exact状態・solver・modelIDは変更していない。

旧候補（HR70、TBV5250、2ms）は次のように分解できた。

- mean PA20.903、PVein13.660、LA10.585 mmHg、肺net flow6.099 L/min。
- PA→PVeinの実効負荷1.188、PVein→LA0.504、合計1.692 WU。
- LVEDP15.522 mmHg、外圧0。同じLA mean10.585でもnative-event LVEDPは約4.94高く、両者を交換して評価できない。
- 同構成のTrefを20%増やした保存試験では、mean LAは約9.99まで下がるがCOも増え、mean PAは20.59までしか下がらなかった。収縮力だけで解決するとは言えない。

実装上、`pulmonaryResistance`は`group="pulmonary"`の2区間（PA→PArt、PArt→PCap）にだけ掛かり、その先の3区間には掛からない。非虚脱・線形定常近似で全PA→LAの抵抗は `(0.05*k + 0.07025)/0.06` WU。現在k=.625で1.6917、既存研究下限k=.45でも1.5458に留まる。LA/COを固定した計算ならmean PAは約20.01だが、これは**閉ループ試験結果ではない**。固定区間が生理的に異常と証明したわけでもない。knob名だけから総抵抗の倍率を推定しない。

再現資料：[全保存結果readback](operating-target-readback.json)、[実行コード](operating-target-readback.ts)、[旧候補の低/中/高容量の追加診断拍](preload-pressure-flow-readback.json)。後者は各endpointの後に記録した2ms診断拍であり、formal endpoint値や1ms qualificationを置き換えない。

### 単一TBV中間点：充満負荷の改善は確認、採用はまだしない

[事前登録](volume-midpoint-preregistration.md)に従い、既存低容量4620と旧候補5250の中間、**4935 mLを1点だけ**cold/2ms/leanで実行した。HR70、Ca、Land、壁・弁、血管抵抗/complianceは同一。構成の再帰比較でもTBVと派生identity以外に変更なし。restは54周期・約30.9秒、既存TBV±12%予備能と診断を含め約72.9秒。後負荷試験や追加gridは行っていない。

|観測|旧候補5250|中間点4935|
|---|---:|---:|
|AoP max/min mmHg|121.67/84.42|111.30/77.52|
|CI L/min/m²|3.210|2.952|
|PAP max/min mmHg|30.39/14.13|26.17/12.06|
|mean PAP mmHg|20.903|17.892|
|mean LA mmHg|10.585|8.403|
|native-event LVEDP mmHg|15.522|10.923|
|mean RA mmHg|3.822|3.080|
|LVEF/RVEF %|55.10/55.21|55.75/56.92|
|AV ET ms|270|258|
|AV mean/peak raw gradient mmHg|4.48/8.44|4.19/7.82|
|Weiss τ ms|33.15|32.04|
|高容量側CO増加率 %|約6.92|15.03|

中間点のrest必須チェックは全通過。LVP/AoPの局所dip-and-recoveryとpost-peak reboundはいずれも0、late PV chord deficitも0。**単峰だから正常、τが32msだから正常拡張能とは判断しない。** ピークは駆出の後方にあり（LVP時間比.746、AoP.825）、その機序と参照法の限界は残る。Glantzは52.43ms、外挿漸近圧−20.33mmHgで、方法間の差も残る。ICT89.1ms/Tei.702と±dP/dtは旧参考帯のwarning。PAP拡張期12.06はTable11の12を厳密には少し超える。

**予備能は`failed-response`のまま保存。** 唯一の不合格は、低容量側のmean RA低下量が0.955864 mmHgで、既存の一律下限1 mmHg未満だったこと。COは19.97%、RV EDVは21.74%低下し、RV ED Ptmは1.214 mmHg低下している。他の方向・量・勾配条件は全通過しており、「CO予備能が消失した」失敗ではない。

この1 mmHg下限は左右共通の構成上の応答下限で、健常者のTBV±12%データから導出した正常境界ではない。小さい圧変化で十分な量・流量が変わる応答を一律に退ける選択圧もあり得る。一方で、値が境界に近いから即座に下限を下げる理由にもならない。**失敗を消さず、圧応答の数値不確実性と生理上の役割を分けて再点検する。** 新点はまだ1msで再確認していない。

Astraが後続診断拍も独立確認したところ、対応する2拍でΔRAは0.955629/0.956104mmHg。各endpoint内の拍差は最大約0.000344mmHgで、1mmHgとの差0.044136よりはるかに小さい。したがって単なる丸めや最終拍の揺れで片付けない。ただしこれらは2ms診断拍で、時間刻み誤差の検証ではない。また、全TBVを変えた閉ループ応答は**孤立したRV収縮予備能**の測定ではない。

高容量側（5527.2mL）はCO+15.03%だがLV ED Ptm20.55mmHgとなる。これは固定制御下の負荷試験の応答であり、全envelopeが安静正常圧内という主張はしない。

結果：[raw result](volume-midpoint-v1/same-material-TBV4935.result.json)、[構成差分と全予備能criterion](volume-midpoint-comparison.json)、[その再現コード](volume-midpoint-readback.ts)、[runner source snapshot](volume-midpoint-v1/source-snapshot.json)。旧結果は上書きしていない。

### 今回の判断と次の小さな作業

1. **4935点は有望な作動点だが未採用。** 高い充満圧をTBV削減で下げ、CI/AoPと高容量側の余地を同時に保てた。これは心筋を再改造する前に充満負荷を整理する根拠になる。
2. 一律1mmHgの予備能floorを、左右の圧スケール・数値解像度・CO/EDV/Ptm応答と合わせて再評価する。変更するなら明示的な新policyと外部1/2 reviewが必要。1点を通すための.95化はしない。
3. 新点の安静・低/高容量について独立1ms再確認を先に行う。2ms結果の近傍から採用済みcheckpointを作らず、mean PA/LVEDP、圧応答、イベント、τ/波形の差を保存する。
4. 16項目は新しいanalysis所有のprospective reference profileとしてまとめる。LV/RVは同じCMR血液腔定義、CIはnet観測と適用条件、SVIはHR固定下の重複を整理、PV ETはmethod-matched資料がなければcontextへ。既存engineの共有reference数値を直接変更すると旧reportの再検証が変わるので避ける。まだ新数値profileを採択していない。
5. baselineの正常域中央化を、すべての数値が同一の点で各参照帯の中央に一致することとは解釈しない。圧・流量・充満と負荷余地を優先し、独立でない指標を過剰に重み付けしない。

履歴上の訂正：9月6日のHR60候補説明にはRVEDVI上限90という記述があったが、当時の保存checkと実装は**87**。結果・採否は変更しない。旧文書/出力の改変ではなく、この追記で訂正する。

今回追加範囲はAstraの明示的APPROVEにより外部1/2 review成立。Claudeは方向性を提案したが具体的diffへの採択判断を保留したため賛同票に数えていない。詳細は[追記したレビュー判断](REVIEW-DECISION.md)。110 tests/7 files、TypeScript、diff whitespace確認が成功。来歴監査のdraft/16 gapsは意図通り未解除。

これは研究artifactとしての記録で、現時点ではGit ignored領域にある。コミット・PRへの保存完了とは称さない。公開baseline、modelID、dev表示の選択は変更していない。

## 続報2：予備能まで1msで確認し、応答screenと数値確認を分離

### 最初に見つかった実行上の制約

従来runnerの`--dt-sec .001`はcanonical restにだけ適用され、予備能のtyped structural sessionは2ms固定だった。旧結果の`preloadReserve.nominalDtSec`も.002と記録されている。**以前の「1ms結果」は予備能まで1msだったことを意味しない。** 旧artifactは書き換えない。

研究sessionにだけ1/2msの指定を追加し、fixed-TBVとfixed-tone両方のforkに引き継ぐようにした。formal protocolの観測呼出しは従来の10ms間隔のままだが、その間の実際のsolver受理間隔を1ms以下に分割する。endpointの追加診断は別に1ms間隔でsampleする。公開typed sessionのbase tickは変更していない。新しい数値protocol名とsource snapshotで、旧実行と区別する。

外部レビューで、途中の1ms区間が失敗したとき、それ以前の成功分の記録を返さない不具合を指摘された。外側の要求時刻、実際に進んだstep数、clippingとsubstep記録を集計するよう修正し、2回目の呼出しを失敗させる回帰テストを加えた。成功時の計算は変わらない。fine runのsource snapshotはこの**失敗時metadataだけの修正前**なので、その差を明示する。後からsnapshotを現コードに置き換えない。

### 独立cold 1msの結果

[事前登録](volume-midpoint-fine-preregistration.md)の同じ4935mL/HR70構成で、rest・低/高容量を再計算した。construction hashは2msと一致。rest56周期・約75.7秒、予備能と診断を含め約220.2秒。新たなパラメータ条件、後負荷試験、Ca/Land変更はなし。

|指標|2ms|1ms|
|---|---:|---:|
|AoP max/min mmHg|111.296/77.525|111.354/77.548|
|CI L/min/m²|2.95185|2.95349|
|mean PAP mmHg|17.8919|17.8717|
|native LVEDP mmHg|10.9233|10.9407|
|AV ET ms|258|255|
|AV mean/peak raw gradient mmHg|4.194/7.821|4.269/7.857|
|ICT / IRT ms|89.14/92|93.14/94|
|Tei|.7021|.7339|
|LV +/−dP/dt mmHg/s|2564/−1539|2600/−1556|
|Weiss / Glantz τ ms|32.037/52.428|31.736/52.750|
|低容量側のmean RA低下 mmHg|.955864|.955884|
|低容量側の右心CO低下 %|19.9668|19.9628|
|低容量側のRV EDV低下 %|21.7404|21.7305|
|低容量側のRV ED Ptm低下 mmHg|1.21393|1.12931|
|高容量側の左心CO増加 %|15.0256|15.0499|

両刻みともrest必須checkは全通過、旧予備能判定は**同じ右低容量側のΔmean RA≥1のみ不合格**。圧変化の差は約.0000195mmHgだが、それだけでは同じ向きの数値誤差が差分で相殺され得る。個別endpointのmean RA差の絶対値和も報告した：center/lowで.007323mmHg、center/highで.012278mmHg。前者は約.956mmHgの応答より小さい。

全指標が同じ精度ではない。低容量側RV ED Ptm応答は約.0846mmHg（粗い値に対し約7%）変わり、ICT/Teiにも約4%の差がある。瞬間イベントを含む値について「全部1%未満」「収束次数を確立」とは言わない。両刻みとも方向・既存Ptm応答下限は保たれた。

restのLVP/AoP局所dip-and-recoveryは0。1msのcenter/low/highの**追加診断第1拍**でも局所reboundとlate PV chord deficitは0だった。ただし、この追加診断traceはaccepted-step duration/atrial capture identityを保持していないため、同じ厳密observerによるendpoint ICT/IRT/Tei/τは未評価。時刻やcapture IDを合成して埋めていない。これはrestのτ評価とは別である。

全差分、各endpointの圧、settlement、旧判定と追加screenは[比較JSON](volume-midpoint-resolution-comparison.json)、[再現コード](volume-midpoint-resolution-readback.ts)に保存。[1ms raw result](volume-midpoint-fine-v1/same-material-TBV4935.result.json)と[source snapshot](volume-midpoint-fine-v1/source-snapshot.json)も保持した。

### 一律1mmHgの代替は、別の数値への置換ではない

固定TBV変更は、圧変化を外部から指定する実験ではない。量・流量が十分変化しても、complianceや左右心室・静脈還流の結合によって心房平均圧の変化は小さくなり得る。さらに固定したΔCOに対してΔPを小さくすると、旧1mmHg下限には不利だがΔCO/ΔP下限には有利になる。この2条件を独立した生理学的証拠と数えることはできない。これはモデルの数式・制御条件からの考察で、今回の.956という数字から導いた新正常値ではない。

補足の一次研究としてKumar2004の抄録を確認した。健常者の2群（12/32例）、3L salineを3時間で投与した研究で、圧の変化と容積/拍出の変化の対応に限界があった。測定法に注意すべき根拠にはなるが、反射・体液移動のあるsaline loadingを、固定制御のTBV±12%に置き換えて閾値を導出しない。全文の図・各個人の数値は今回は確認していない。[Kumar2004、PMID15090949](https://pubmed.ncbi.nlm.nih.gov/15090949/)

`MainWirePreloadReserveResearchScreenV2`を追加した。**研究候補のscreenであって、mint gateの置換ではない。**

- 心房平均圧は方向（ΔP>0）を確認。一律1mmHgという振幅条件は旧判定として併記する。
- CO/EDV/Ptm等の既存の実質的応答下限は保持。これらも暫定的な構成上の設計余裕であって、確立した正常分布ではない。
- 使用する全scalar・ratioの有限性とCO/EDVの正値を確認。Infinityを大きな応答として通さない。
- 変化量と比率は変更前後のendpointから再計算する。保存された冗長なdelta/ratioが、方向・浮動小数点の演算許容差と整合しなければ未解決にする。この演算許容差は生理の閾値ではない。微小な正負の矛盾も「近い数値」として通さない。
- 極小の正のΔPから大きな有限secantが計算されても、「圧座標が解像できた」「数値確認済み」「baseline採用」とはしない。それらの成立flagはfalse、別途settlement・同構成の粗密比較レビューが必要と明示する。
- runnerには追加screenとして出力し、**旧`responseChecks`と`failed-response`は変更しない**。保存済み粗密結果への適用も別artifactとsource hashで記録した。

4935点の左右×低/高容量はこの方向・応答screenを通過した。ただしそれだけでnormal reserveやRV contractilityを認定しない。一般的なnoise-envelope frameworkや候補に合わせた.95mmHg、新しいCVP変化率下限は導入しなかった。

### 次の判断

この孤立した失敗を理由にTBV gridや心筋再調整へ戻る必要はない。残る主作業は、16項目のprospective reference profileと、その観測方法に整合する最終採用判断をまとめること。細かなtiming/ED Ptmの感度は残課題として扱うが、そこを隠すために平滑化や閾値への数値追込みは行わない。新screenは公開gateの代替ではないので、現時点でbaseline採用・modelID mint・devの表示変更はしていない。

日常の候補探索は従来の軽量2msを維持し、1msの独立cold＋予備能確認は最終候補に限定する。今回の全分岐1msは約220秒で、2msの約73秒より重いが、候補数を増やさず検証に必要な1回として実施した。一般的な高速化projectや並列基盤は追加していない。

研究用数値設定修正は両者が範囲限定承認、新しいscreenはAstraの具体的コード再レビューで1/2承認。[採択と不採択の詳細](REVIEW-DECISION.md)に記録。旧結果・公開判定を都合よく更新したものではない。

最終確認：関連8 test files・141 tests、TypeScript型検査、`git diff --check`成功。gate provenance監査は意図通りdraft/16未確定のまま。解析コードが動作することと、生理学的なreference profileが完成したことを区別している。

## 続報3：16項目を同じ拍・出典別に比較し、次の採用判断を絞る

### 追加したものと、変更していないもの

`MainWireRestingReferenceProfileV1`と`MainWireRestingReferenceComparisonV1`を追加した。16未確定targetとmean PAPを対象に、文献の観測法・population・範囲の意味を保持して、同じcompleted beatから比較する。研究runnerへ追加し、保存済み4935候補の2/1msにも適用した。**新たな定常化・parameter調整はゼロ**。再現資料は[readback](resting-reference-readback.ts)、[数値・source hash](resting-reference-comparison.json)。公開modelID、baseline選択、既存の閾値・role・旧結果・旧provenance監査は変更していない。

このprofileは、将来の採用policyに使うための**出典別比較**であり、それ自体はmint policyではない。`inside-source-range`はモデルがその測定法で正常と検証されたという意味ではなく、`admissionDecision`は`not-performed`。対象条件の適用可否も、見栄えのよいscalarから推定しない。未知の年齢・性別は未知のまま、全stratumを報告し、合格数や都合のよいstratumを選ぶ総合判定を設けない。

### 中心AoPを120へ強制する根拠はない

Herbert2014の原著Methods/Tables1-2を確認。多施設の非侵襲推定cSBPを測定法間で標準化した資料で、Table2は年齢・性別別の10/90百分位であって95%正常限界ではない。しかもMethodsは、cuffで校正した推定cSBPと侵襲的Ao圧の差を明記する。AoP111をそのまま上腕血圧111と解釈したり、一定のmmHgを加えて補正したりしない。新profileは成人の全男女・年齢列をcontextとして保持し、cSBP sourceをAoの必須閾値に転用していない。Ao拡張期には検証済みの独立した正常区間を置かない。[Herbert2014](https://academic.oup.com/eurheartj/article/35/44/3122/2293191)

### LV/RVは同じ血液腔定義で比較する

SCMR2025のTables2/8（papillary/trabecular myocardiumを血液腔から除外）を採用した**比較**。この回は学会公開のaccepted preproof PDF14-15/26-27ページ全体を視認し、前回の最終版table転記と一致することを確認した。preproofを最終version of recordと称さない。sample sizeは変数ごとに異なり、LVとRVが同一の一群で測定されたjoint分布でもない。[SCMR2025](https://doi.org/10.1016/j.jocmr.2025.101853)、[確認したpreproof](references/scmr-2025-preproof.pdf)

|1ms候補の観測|値|男性参照との数値比較|女性参照との数値比較|
|---|---:|---|---|
|LV EDVI / ESVI mL/m²|75.64 / 33.45|両方範囲内|両方範囲内|
|LVEF %|55.78|範囲内・低め|範囲内・下限に近い|
|RV EDVI / ESVI mL/m²|74.06 / 31.87|両方範囲内|両方範囲内|
|RVEF %|56.97|範囲内|範囲内|

男女unionを作らなくても、この候補の6項目はどちらのstratumとも矛盾しない。一方で「全指標の中央」とは言えない。女性LVESVI上限34/LVEF下限55にも近い。これは性別の割当てや正常分布内での確率の計算ではなく、同一methodの各限界との比較に留まる。0D geometryが画像segmentationと実験的に一致したという主張はしない。

### 圧とflowを、独立でない指標まで全部同じように重み付けしない

RHCのRAP2–6、PAP15–30/4–12、mean PAP8–20、CI2.5–4、SVI33–47と、PAWP≤15をそのまま出典比較として記録した。PAWPの下限を新設せず、mean LAはあくまで代理観測、native-event LVEDP10.94は別に保存する。候補のRAP・PAP最大・mean PAP・CI・SVIは参照内、PAP最小12.03388は参照12を**厳密には超える**。丸めやepsilonで消さない。LA mean8.38も実測PAWPとの同一性を認定したものではない。[ESC/ERS2022 Table11](https://doi.org/10.1183/13993003.00879-2022)

CIはnative AoVのsigned **net** flowを使う。今回は逆流0なのでforwardとの差は0だが、将来の逆流presetでは等しくない。冠動脈起始より遠位のCMR測定面に無条件で置き換えない。

ここで計算上、CI=HR×SVI/1000である。CI2.5–4に対応するSVIはHR60で41.67–66.67、HR70で35.71–57.14。したがって、文献のSVI33–47まで独立の必須条件として同時に輸入すると、HR60のCI上限は2.82に制約され、CI中央3.25が実現不可能になる。**これは文献や現在の35–65の旧SVI実装が誤っているという意味ではなく、別々の周辺分布をHR固定のjoint制約に転用する問題**である。新profileはCI条件付き区間を計算し、文献SVI帯は別のcoupled contextとして保持する。独立な二つの収縮力検証に数えない。

### ETは、数値の一致と観測法の一致を分ける

AV ET255msはCopenhagen2023のpooled248–336ms内だが、同論文はmitral-leaflet color-TDIの測定であり、測定法が違えば正常値も異なり得ると明記する。native positive-flow durationを同法の値と断定しない。PVについてはvan Oort1988のPA/RVOT Doppler、215人・1–65歳という方法・集団まで確認したが、成人のET正常区間は未確認。RVOT acceleration time、TDI S波の長さ、LVETから代用の上下限を作らなかった。[Copenhagen2023](https://link.springer.com/article/10.1007/s00392-023-02269-2)、[van Oort1988](https://pubmed.ncbi.nlm.nih.gov/3383877/)

### 現時点の判断

4935候補の作動点・充満負荷・固定制御下の量応答は、旧5250よりbaselineとして扱いやすい。今回の出典照合から新たにTBVやCa/Landを再探索する理由は見いだしていない。一方、ICT/Tei高め、LVEF低め、PV timingの参照不足、PAP最小の小超過、RV ED Ptmの刻み感度は残す。単峰・τ・CIのどれか一つで他の課題を打ち消さない。

新profileにより16項目の**比較方法と根拠の所在**は具体化できた。ただし旧16gateの未確定supportが自動で解消したのではない。次の採用policyは、残すoperating条件、contextにする指標、source-backedだが工学的選択である範囲を明示し、旧gateと別versionでレビューする。共有engine定数を後付けで変更して旧reportの意味を変えない。

### 外部レビュー後：4935を作業用採用候補として固定

AstraとClaude Fable5.1 maxは、追加の比較処理を範囲限定でAPPROVEし、4935を次の作業用候補に選ぶことを支持した。これを受けて[選択記録](working-baseline-selection.json)を保存した。**今後の作業基準を4935に固定するが、公開baselineの採用完了ではない。** 元の2/1ms結果のSHAを固定し、結果内の`baselineAdopted:false`や`failed-response`は書き換えない。

両者の採用policy提案は同じではなかった。ClaudeはPAPの最大/最小までblockingにする案、Astraはnet CI・mean RAP・mean PAPをoperating条件としphasic PAPは参照warningにする案だった。私はこちらを採る方向としたい。平均圧とnet流量による作動点を優先するという**縮約モデルの設計判断**であり、12.03388を4–12内と認定するのではない。最大/最小を必須にした後、今回だけ例外を許す方法は採らない。CMR男女intersectionが常に正しくunionが常にcherry-pickingというClaudeの一般化も採用しない。いずれも宣言すべき設計上の選択で、母集団の正常域と同一ではない。

重要な追加所見：Astraの指摘を主担当も保存traceで再現した。次のMV positive-flow cessationは実際に記録された次の心室captureより2ms実行で13.143ms、1ms実行で15.143ms早い。そのときCaは.13173/.13188µMで、床値.13に近い。つまりhydraulic flow stopと、電気的activationや画像上のleaflet closureを同じものとするのは不適切である。一方、この時間をICTから引いた値を「正しい臨床ICT」に置き換える根拠もない。波形・Ca/Landを変えず、元のICT/Tei warningを維持した。[実測eventとhash](timing-origin-comparison.json)、[再現コード](timing-origin-readback.ts)。ここでは観測されていない前拍のcapture時刻を合成していない。

レビューを反映して、NET指標には旧forwardとは異なるmetric IDを付けた。ETの単一forward episodeは別の既存observerが確認する条件だと明記し、この比較処理自身が確認したとは称さない。PAWP片側上限の比較結果は`not-above-source-upper-limit`とし、「正常範囲内」と読める表現を避けた。CLIは実行前にもHR60/70を検証するため、将来の任意HR対応まで広げる仕組みは増設していない。

関連9 files・151 testsと型検査成功、その後の小さな表現/metric ID変更も関連28 tests・型検査・再解析・diff whitespace確認成功。旧provenance監査はdraft/16を保持。両AIの助言は独立実験の代わりではなく、今回のAPPROVEは新たな数理モデルIDやmint gate全体の承認ではない。artifactはGit ignored領域であり、コミット・PR・push完了とは称さない。

次のpolicyでは平均肺圧/flowだけで全身循環を免責しない。Aoの広い既存90–140/60–90は正常分布ではなく全身負荷の設計条件として残す案、ETの数値帯はcontextへ移してevent/episodeの成立を必須とする案を検討する。native LVEDPの非高値条件も必要だが、その16mmHg程度という提案値は不等号と測定時相を原典で確認してから決める。先に候補を選んだことを理由に、新policyの合格を保証していない。

## 継続4：新しい採用判定を実装し、4935候補を再評価

### 何を変更したか

新しいanalysis-owned `main-wire-prospective-baseline-admission-v1` と、固定制御下の `main-wire-preload-reserve-admission-v1` を実装した。これは研究構築を独自exact identityへ進めるための科学的適格性判定であり、旧Standard70の公開gateを後付けで読み替える変更ではない。**この回ではCa/Land、血管、弁、TBV等のモデル式・パラメータを変更していない。**

- net CI2.5–4、mean RAP2–6、mean PAP8–20を、測定座標の限界を明記したsource-informed operating条件にした。phasic PAPの参照15–30/4–12は残し、超過を丸めて消さずwarningとして表示する。
- Ao90–140/60–90は、極端な全身負荷をbaselineに置かないための既存engineering load guard。Herbertから導出された正常区間と称さない。
- ASE2025原本のTable1 p539、Figure1 p540をページ全体で確認した。rest LVEDPは**>16**が高値基準。native MV flow cessation時圧≤16をsource-informed engineering ceilingとし、臨床の圧上昇開始前のEDPとの完全な時相一致や、下限を含む正常域を主張しない。mean LAをLVEDPに置き換えたのでもない。[原著PDF](https://www.asecho.org/wp-content/uploads/2025/07/Left-Ventricular-Diastolic-Function.pdf)
- ET/ICT/IRT/Tei、E/A、±dP/dt、PV上辺の丸み等は、必要な観測を残して方法依存の参照帯とする。単一forward episode、順序、有限性、gradient、未説明のringing、AVC→MVO rebound、τのfit usability、圧微分の数値品質は別の必須条件として残した。
- anatomyは両性別のCMR範囲を常に表示する。**今回の性別未指定・汎用baselineの自動判定に限り**6項目が両stratumに入ることを保守的な設計条件にし、外れた場合は`demographic-review-required`にする。患者の正常性をintersectionで定義する意味ではなく、preset/個別fittingへこの条件を転用しない。欠測や不正なvalve landmarkは別のunresolvedである。SVIはnet CI/HRと結合したcontextで、独立した第二のCO必須帯にはしない。

### 予備能の圧変化1mmHgに代わって何を確認するか

制御するのはTBV±12%であって、RA/LA圧の変化幅ではない。圧変化は正方向を要求し、CO・EDV・transmural pressureの既存engineering response floorを維持する。さらに、同一構築の独立2ms/1msと、両格子のcenter/low/highのreservoir settlementを必須にした。

各criterionをprimitive endpointに対する線形残差に変換する。たとえば3% CO条件は高容量側で`CO1−1.03 CO0`、低容量側で`.97 CO0−CO1`、secant条件は`ΔCO−.02 ΔP`となる。両格子の小さい残差が、係数付きの**個々のcenter/endpoint差の絶対値の和**より大きいことを確認する。既に差分や比にした値だけを比較すると、共通する変化を相殺してしまうためである。これは観測された二格子数値感度のscreenで、真の誤差上限や収束次数の証明ではない。境界ちょうどはscreen上の下限を通っても、採用余裕がないので適格にしない。

レビューで、保存された冗長なΔの丸めだけから正の余裕を作れてしまう境界不具合を発見した。marginもsecantもprimitive endpointから再計算するよう修正し、ΔPtmが正確に.25のとき冗長値に1e−15を加えても通らない回帰を追加した。screen内部の許容誤差を生理学的な余裕に転用しない。

### 再評価結果と費用

旧2ms結果にはreserve内部dtを明示する新protocol markerがなかった。実装に過去artifact専用の例外を増やさず、同一4935/HR70条件を現行のhot-path-leanで1回だけ再実行した。**54周期、rest+reserve+記録で72.4秒**。既存の独立1ms（56周期、220.2秒）との構築hash一致を確認した。これは新しいparameter探索ではない。旧2ms結果も削除・変更していない。

[再判定結果](prospective-admission-candidate-v3.json)は`eligible-for-exact-model-promotion`。両格子のrest、ordered native events、τ usability/rebound、4個の±dP/dt品質、左右low/high reserveの全てが通った。

- LV +/−dP/dtの二格子差は1.38%/1.12%、RVは2.85%/1.01%。既存5%数値感度条件と隣接同符号segment supportを満たす。臨床的正常値の証明ではない。
- 以前止めていた右低容量ΔRAPは約.9559mmHg。個別endpoint差の和.00732mmHgより大きく、正方向応答は二格子差に埋もれない。CO約−20%、EDV約−21.7%、ED Ptm応答も残る。
- 右低容量のΔED Ptm−.25の余裕は.8793mmHg、個別endpoint差和.08462mmHg。約7%の応答差そのものは残し、数値誤差ゼロと称さない。
- ICT/Tei高め、PAP最小12.03388が参照12を超えること、LVEFがCMR帯の低めにあること、Weiss/Glantzの方法差は引き続き可視化する。

再判定CLIは既存result JSONを読み、別の新規出力だけに結果とsource/implementation SHAを保存する。自己のresearch checkpointを公開Standard70へ偽装せず、原recordの`failed-response`をそのまま残す。旧provenance16項目のdraftも解除していない。

### 残る作業

この判定コードと候補への適用について、指定のAstra/Claude Fable5.1maxへ具体reviewを依頼した。最終採択記録はREVIEW-DECISIONに残す。外部1/2を満たした後は、追加の微調整gridではなく、4935構築に固有のexact identity・自己checkpoint・最新互換Surface/analysisを結び、実workbenchとanalysisの一致を検証する。**公開baseline変更・modelID mint・PR/pushはまだ行っていない。**

その後、**AstraとClaudeの両者から範囲限定APPROVEを取得し、主担当として採択した**。指定の1/2要件を満たす。Astraの独立57tests/hash照合/全残差再計算、Claudeの静的code・数理reviewを区別して記録した。[最終判定v4](prospective-admission-candidate-v4.json)には参照逸脱を先頭にも表示し、人口層ラベルを維持する。非zero二格子差の合格回帰を追加したが、判定数式と適格性結果は変わらない。

次は2msを日常実行側、1msを確認側としてproduction bindingを行う。HR60はpolicy上の許可であり、同候補のHR60適格性は未確認。reserveのlast-three-beat RA/LA圧driftそのものや、reserve endpoint全体のstrict tau/ringing評価は今回の証拠に含まず、二格子一致だけでは共通biasを否定できないというlimitationを保持する。この点の追加記録を今後の通常実行に組み込む余地はあるが、今回の採用にさらに探索gridや後負荷試験を要求しない。

## 継続5：採択構築をStandard71のローカルexact ownerへ固定

### 変更と非変更

広い研究probe factoryに依存しない固定Standard71 factory、専用checkpoint envelope/restore、typed session、既存Studio hostへの分岐を実装した。今回は追加fittingも式変更もない。採択済みのTref238816.54628141236Pa、CaT50Ref0.6µM、beta1−1.2µM、Land slack1、Ca時間倍率1.1・rise比0.9・floor0.13µM、全身動脈compliance倍率0.65、大動脈root L=0を固定した。既存の肺動脈algebraic root、弁則、Ca/Land状態数は変えない。これらの校正値は独立実測されたヒト正常パラメータとは称さず、元論文値と校正来歴を保持する。

baselineはHR70・TBV4935、ventricular active倍率1。公開側の既存contractility制御はこの固定referenceを倍率で動かせる。研究factoryの「active倍率1のみ」の探索制約をUIへ持ち込まない。52 primitive controlsを全てfixtureから投影し、既定値の不一致をテストで防いだ。TBVのみStandard71限定で5mL刻みとし、4935をそのままReset可能にした。範囲4200–7000は不変、旧70の50mL刻みも不変。これは操作分解能の変更であり、生理許容範囲の拡張ではない。

### 独立cold replayと正しいcheckpoint

[実行コード](../../../tools/scientific/qualifyMainWireStandard71BindingV1.ts)で、新factoryをcoldから2msで実行した。54周期、約29.9秒でperiod1に達し、SHA固定の採択研究2ms結果と**定常周期の全trace、completedBeat全項目、native-event観測窓が完全一致**した。研究checkpointを復元して名前を変えることはしていない。[記録](standard71-binding-v2/binding-evidence.json)

- 周期境界：46.285714285714285s、専用checkpoint SHA `a420eba062f7cda8dd4b6545ea3c39ebd906ba57f20e05ceaa4df13967da94ca`。
- adapter初期テストとAstra独立確認で、この周期境界はworkbenchの2ms base grid上にないため、そのまま起動するとrejectされることが分かった。
- 次の46.286sまで0.285714msを**実際に計算して**、別の起動checkpoint SHA `854ff78b9a9aac455fa3fe4af991b04b6a88f0ee065ab175500003d96bfabc65` を作った。元のcheckpointは保持。completedBeatは不変、両checkpointの自己roundtripと継続一致を確認した。時刻だけを書き換えていない。
- 旧70、raw研究checkpoint、および研究baseを71 outerで包んだものは、71の実contextでrestoreするとrejectする回帰を追加した。

新2ms baselineはAo111.296/77.525mmHg、net CI2.95185L/min/m²。1ms結果と混同せず、研究段階の警告と限界はそのまま保持する。今回71でfine/reserve全体を再実行したとは称さず、同一物理構築への既存2/1ms承認と新しいexact cold replayを別の証拠として結ぶ。

### Surface・解析・配布モジュールの検証

Standard70の最新Surfaceのcontrol/output/graph/knob/protocol/解析pinを全て継承し、同じSurface seriesの後続としてIDとdisplayNameのみ変更した。内部`generation:68`はrelease番号ではなく能力群なので保持し、71専用のcreate/restore/checkpoint/analysis-copy/warm-start分岐を追加した。controllerや解析が旧式fallbackへ落ちることを避ける。

simulationAdapterとexecutionPlanの両起動経路で、新しい起動checkpointを使う。完全に一致する既定fixtureかつ明示checkpointなしの場合だけで、変更fixtureへ流用しない。両経路でTBV4940→4935と次stepを実行し成功した。

native Starling orientationの低容量partitionは約49.3秒、formal fixed-TBV PVの低容量partitionは約46.6秒で完了。formal loopは4点以上・各12samples以上あり、analysis前後のlive frameは不変だった。これはsource adapter経由の解析検証であり、全てのvolume端点や全presetの合格という主張ではない。full-invariantの重複walkを含む初回の長い実行は停止し、実live workerと同じhot-path-leanで検証した。checkpoint/構築/偽装拒否は別のfull-invariantテストを維持した。

[配布モジュール検証](../../../tools/scientific/verifyMainWireStandard71ArtifactBindingV1.ts)では、2回のself-contained ESM buildが一致し、ソース/実artifactの起動と12stepの全frame、TBV既定値action、保存復元後の継続が一致した。snapshot admissionもpassed。[実行記録](standard71-artifact-v2/artifact-binding.json)。packageはまだignored研究dirに置いた候補で、registry admission lockではない。

主担当確認：新構築6tests、Studio binding7tests、既存70release9tests、関連policy/provenance/reserve57tests、suite inventory6tests、tsc、diff whitespaceが成功した。新Studioテストの所要は約99秒。実際の正式解析を行うためcanonical laneに置いた。

### 残る公開前作業

1. ローカルcomposition/descriptor/artifact登録を揃え、実browserで波形・PV・Starling・全controls・保存復元を確認する。
2. baseline infoとmodel documentationを71の構築・新しい評価policyへ合わせる。旧「41全項目合格」、旧material/Ca/aortic L説明は流用しない。
3. reviewed evidenceと実artifactを結んだ最終admissionを行う。旧provenance draft16の解除、remote publish、既定baseline切替え、commit/PR/pushは今回まだ行っていない。

構築をさらに微調整する理由は今回のbinding検証からは得られていない。次は残る登録/表示の整合性を仕上げる。ICT/Tei、PAP最小、方法差、reserve endpointの記録限界を隠して「正常」と断定しない。

## 継続6：Standalone model documentation（2026-09-07）

ユーザーの指示に従い、読者を三層に分類せず、深い入れ子のない説明ページを実装した。今回、数式モデル・係数・採択policy・公開既定は変更していない。

- Standard71は「全体像 → しくみ → baseline設定 → baseline評価 → 閉じた変更履歴／再現情報」の順。循環接続図と結合関係図、採用式の抜粋と適用条件を載せた。各moduleと評価行のdetailsは一段だけで、全開閉とアンカーを備える。
- module説明は版を持つ独立データに分離し、71が使うmodule集合を明示。モデル比較は冒頭から外した。Standard66–70は同じページ上のmodel selectorから旧記録／旧書式を参照する。過去評価を現在のpolicyで再ラベルしていない。
- `generateMainWireStandard71DocumentationV1.ts`はSHA固定のadmission/coarse/fine記録を読み、cold bindingとのrest一致と、現行fixtureの血行動態・mechanism・Land値・bridge exit・Ca・runtime・slack値の一致を確認して表示専用snapshotを生成する。シミュレーションや新しい採択判断はしない。52controlの既定値、材料の原著値／採用値、source provenanceもsnapshot化した。
- baselineの採用範囲、原著の範囲、役割、警告、測定方法を区別した。男女CMRの共通部分を採用範囲として表示し、原著の男女別範囲も両方保持する。raw AV/PV圧差、mean LAとPCWP、native timingとDopplerの差を明示する。AoPの工学的範囲を文献正常範囲とは呼ばない。
- 2ms（71独立cold replayと一致）と1ms（同じ物理構成の研究結果）を切り替えて読める。ICT/Tei・±dP/dt・PAP最小の警告、τの2方法、両方向reserveと未実施の終点評価を隠さない。全文書データをJSONで取得できる。
- Workbenchの71用compact infoは同じbaseline行から作り、exact model／Surface／全default fixtureが一致した時だけ表示する。公開registryへの71登録はまだなので、71実workbenchでのend-to-end表示は次の登録工程で確認する。

検証：model docs20件＋Workbench86件＋suite inventory6件の計112 tests、desktop/mobile ChromiumとWebKitの3 browser tests、typecheck、production buildが成功。ブラウザでは深いdetailsなし、横方向overflowなし、モデル切替、全開閉、測定記録ダウンロード、pageerrorなし、simulation worker起動なしを確認。overview/mobile画面も画像で目視確認した。Vite buildの既存大型chunk警告は残る。

既存4185は研究candidateのmodule差し替えを持つdev serverのため触らず、差し替えのない確認用4186を別cacheで起動。アプリ内ブラウザでも71説明ページを確認した。設定・スクリーンショットは `artifacts/model-documentation-2026-09-07/`。新しいruntime登録・公開・既定切替・PR/commit/pushは行っていない。
