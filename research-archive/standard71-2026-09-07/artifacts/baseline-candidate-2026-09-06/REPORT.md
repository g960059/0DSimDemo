# Baseline採用候補に到達 — 2026-09-06

## 結論

**`vascular-center-R1.04`（HR70）を、研究内のbaseline採用候補に選定する。** この構成自身の2ms/1ms独立cold定常化、低・高容量応答、Tref±20%操作、未平滑化のLVP/RVP/PAP/PV loopを確認した。Codex 6 Astra maxの支持確定で、ユーザー指定の1/2レビュー条件を満たす。Claude Fable 5.1 maxも条件付き支持。採否・留保は [REVIEW-DECISION.md](REVIEW-DECISION.md) に記録した。

公開model ID・既定baseline・Surfaceを変更したという意味ではない。今回の到達点は、再現可能で、主要な圧・流量・タイミング・形状・容量応答を同時に持つ候補の確保。**すべての生理指標が正常中央、正常ヒトの一意な同定、広い病態範囲で検証済み、という主張はしない。**

### 生波形

- [1msのLVP/Ao node、RVP/PAP、LV/RV PV loop](selected-waveforms-final.png)
- [低容量・baseline・高容量の未平滑化overlay](selected-preload-waveforms-final.png)
- [測定・構成・出典hash・予備能・操作応答のJSON](selected-evidence-final.json)
- [再現用の候補入力](selected-fine.json)

生波形を視認した。以前のLVPの二峰性・再上昇と、PAP拡張期の大きな再上昇はない。駆出後半のPV chord deficitはbaseline、低容量、高容量で0。これらは記述的な比較であり、「正常カテーテルPV loopの形」を証明する指標ではない。圧ピークが駆出後半に寄ることは残り、下記で別に扱う。

## 最終候補の数値

HR70、BSA1.9m²。同じconstructionをそれぞれ独立にcoldから開始。2msは145周期、1msは146周期で、全連続状態を含むperiod-1差が既存基準を3回連続で満たした。

| 指標 | 2ms | 1ms |
|---|---:|---:|
| Ao node systolic / diastolic, mmHg | 121.67 / 84.42 | 121.73 / 84.44 |
| CI, L/min/m² | 3.210 | 3.211 |
| CO, L/min | 6.099 | 6.101 |
| SV, mL | 87.12 | 87.16 |
| AV ET, ms | 270 | 268 |
| AV mean / peak gradient, mmHg | 4.48 / 8.44 | 4.54 / 8.48 |
| ICT / IRT, ms | 65.14 / 96 | 67.14 / 96 |
| Tei | 0.597 | 0.609 |
| MV flow E/A | 0.928 | 0.924 |
| LVEF / RVEF | 55.10% / 55.21% | 55.12% / 55.26% |
| LV EDVI / ESVI, mL/m² | 83.22 / 37.36 | 83.22 / 37.35 |
| RV EDVI / ESVI, mL/m² | 83.06 / 37.20 | 83.01 / 37.14 |
| PAP systolic / diastolic, mmHg | 30.39 / 14.13 | 30.37 / 14.10 |
| mean PAP, mmHg | 約20.9 | 20.87 |
| CVP / mean LA, mmHg | 3.82 / 10.58 | 3.82 / 10.55 |
| LV +dP/dt / −dP/dt, mmHg/s | 2724 / −1657 | 2766 / −1676 |
| PV mean / peak gradient, mmHg | 4.61 / 7.73 | 4.68 / 7.79 |

両刻みで安静時blocking checkは0件の逸脱。±dP/dtは既存の参考帯から外れ、warningを保持した。この追試で警告を消したり、候補を通すために閾値や役割を変更したりしていない。

測定定義:

- AV/PV gradientは**正方向flowがある期間の上下流absolute node圧差**の時間平均/最大。無条件にDopplerの4v²や圧回復後カテーテル差と同じとはしない。
- E/Aはnative弁の**体積flow**比。可変開口のDoppler速度E/Aと同じ測定ではない。
- ICT/IRT/Teiは弁flowのeventから計算。心筋単体のtwitch relaxation timeやTDIの時間とは区別する。
- mean LAをPCWP surrogateとして記録。独立した肺毛細管楔入圧の測定ではない。
- PV loopはtransmural pressure。高容量では外圧が非ゼロなので、absolute EDPと同じではない。

## 数理モデル側で変えたこと

状態変数を増やさず、既存Ca–Land–幾何の結合を研究構成として再校正した。最終候補の入力と完全なownerはresultのconstructionに保存している。

| 項目 | 最終候補 |
|---|---|
| 心拍/容量/末梢抵抗 | HR70、TBV5250mL、systemicResistance1.04 |
| 心室共通Tref | 238816.546Pa。LVFW/SEP/RVFW共通、重複active倍率なし |
| 心室passive倍率 | 1.04。既存の平衡弾性とSLSの定義を維持 |
| CaT50ref / beta1 | 0.6µM / −1.2µM |
| 追加のLand stretch倍率 | 1。幾何由来stretchそのものは変えていない |
| Ca | floor0.13µM、peak0.592586µM維持、時間scale1.1、rise fraction0.9 |
| Systemic arterial compliance scale | 0.65。肺動脈へは適用しない |
| Ao–SA慣性 | 0。全弁/全血管の慣性を除いたという意味ではない |
| 維持したもの | 心房、既存rounded Land kinetics/Aeff/strong-bridge exit、弁EOA、PA root構成、保存則 |

実際のCa rise/decay定数は118.54/131.71ms。これらは既存2-state Ca event ownerへ設定され、波形を後から整形していない。元の細胞Ca fitを維持したとは主張しない。

### なぜTBVだけを増やすより改善したか — モデルからの考察

Landの長さ依存Ca感受性はreferenceとslopeの組み合わせで決まる。以前の有力候補では、追加stretch倍率と強い長さ依存性が、長い心筋長・低Caの時にも残存張力を作りやすかった。一方、駆出で短縮するとCa感受性が下がり、拍出終盤の力を得にくかった。

今回のjoint affinity校正は、長い時と短い時を別々に都合よくclipするのではなく、単一の滑らかな既存lawのreference/slopeを変更する。floor低下と追加stretch倍率の除去も組み合わせ、拡張期の残存能動張力を小さくしながら短縮時の力を確保した。**複数因子を含む最終候補なので、この改善のすべてを一つの係数へ因果帰属していない。**

候補のLVFW stretchは安静約0.933–1.136、高容量でも最大約1.162。Landの1.2 capで予備能を人工的に止めている状態ではない。1ms安静のLVFW active fiber stressのpeakは約84.7kPaで、Tref239kPaそのものが1拍中の実応力ではない。material圧再構成誤差は約3e−14mmHg。

原著Landもskinned cellからintact twitch、whole organへ移す際に感受性・協同性・kineticsを再校正している。原著Appendix C.2はTref120kPaがそのtwitchデータから独立に拘束された値ではないと明記する。従って再校正自体は合理的だが、今回の0.6/−1.2/239kPaがヒトの正解と証明されたわけではない。[Land et al., 2017](https://pubmed.ncbi.nlm.nih.gov/28392437/)、[保存した著者稿](../diastolic-activation-2026-09-05/land2017-author-manuscript.txt)

## 容量予備能と操作余裕

### 固定制御・TBV ±12%

既存のfixed-tone reservoir-settled protocolを使用。低/高容量の定常化は各28拍、2ms。1ms追試は安静時についてのみ行っており、容量端点を1ms検証済みとはしない。

| 指標 | TBV4620（−12%） | Baseline5250 | TBV5880（+12%） |
|---|---:|---:|---:|
| CO, L/min | 5.034 | 6.098 | 6.520 |
| CO変化 | −17.46% | — | +6.92% |
| mean LA, mmHg | 6.33 | 10.58 | 17.41 |
| LVEDV, mL | 127.61 | 158.11 | 171.63 |
| LV end-diastolic transmural P, mmHg | 7.07 | 15.52 | 22.98 |
| CVP, mmHg | 2.51 | 3.82 | 6.59 |
| RVEDV, mL | 124.12 | 157.81 | 185.69 |
| RV end-diastolic transmural P, mmHg | 1.88 | 3.49 | 5.54 |

左右・低高容量の4応答checkは通過。高容量CO/mean-LA slopeは0.0618 L/min/mmHgで、直前の有力anchorの約0.0240から改善。旧anchor比で高容量CO余地は約3.66%→6.92%、mean-LA上昇は約8.71→6.82mmHgへ変化した。

ただし高容量側で圧が約6.8mmHg上がる割にCO増加は約7%にとどまり、曲線は依然として高容量側で平坦化する。この非対称性を消してはいない。現在のreserve閾値は非退行を検出する工学的最低条件で、健常者の検証済み正常範囲ではない。

健常者でも急速輸液で充満圧が相当上昇することは報告されるが、輸液量と閉ループの固定TBV変化は同じ負荷ではない。その文献をこの+12%実験の合否に直結させない。[Fujimoto et al., 2013](https://pubmed.ncbi.nlm.nih.gov/23172838/)

materialの追加readbackは独立コピー上の2ms presentation endpoint。正式reserveの観測拍より後の拍なので、EDP等に小さい拍/phase差がある。高容量MV閉鎖時のabsolute EDP約25.9mmHgと上表のtransmural約23mmHgを混同しない。

### Tref ±20%、その他は固定・端点再fitなし

| Tref | 約191kPa | 約239kPa | 約287kPa |
|---|---:|---:|---:|
| AoP sys/dia, mmHg | 115.79 / 81.42 | 121.67 / 84.42 | 125.42 / 86.25 |
| CI | 3.065 | 3.210 | 3.300 |
| CO変化 | −4.50% | — | +2.80% |
| LVEF | 50.48% | 55.10% | 58.70% |
| ET, ms | 276 | 270 | 264 |
| AV mean / peak PG, mmHg | 3.91 / 7.15 | 4.48 / 8.44 | 4.95 / 9.50 |
| LV +dP/dt, mmHg/s | 2286 | 2724 | 3146 |

両端ともcoldからperiod-1へ定常化し、単峰、late-PV chord deficit0。−側ではEF/容量、+側ではICT/PV mean gradientの**安静**基準を外れる。介入状態まで安静正常帯へ再fitすることはしていない。

これは操作余裕が実在する証拠だが、20%のTref増加でCOが20%増えるわけではなく、全身運動/交感神経応答の再現でもない。正常帯の周辺にどれだけ余地があるかと、病態を表現できるかは別に記録する。

### HR60の追加確認

HRだけ60へ変更し、既存HR依存Ca lawを使い、再fitしなかった。100周期/約63秒で定常化。Ao119.59/78.72、CI3.061、LVEF57.94%、ET286、ICT38、IRT96、Tei0.469、E/A1.044。単峰・late-PV chord deficit0。

ただしRVEDVI91.69mL/m²が現行上限90を外れた。AV mean PGも4.91で上限に近い。今回の採用候補は**HR70**とし、HR60を同じ意味で全合格baselineとは登録しない。

## 今回の探索過程 — 43実行

各batchに入力、結果、protocol、主要source本文snapshotとSHA、construction identityを残した。下表は結論の要約で、失敗条件も削除していない。

| batch | 条件数 | わかったこと |
|---|---:|---|
| operating-points-v1 | 4 | HR60/70×低めTBVだけではE/A、ET/ICT、reserveを同時解決できない |
| filling-refinement-v1 | 6 | Ca floor/passive/時間scaleだけではTei/ICTが残る |
| affinity-v1 | 4 | joint affinityに可能性。Tref160kPaでは低EF、一部RV inlet observer未解決 |
| affinity-amplitude-v1 | 4 | 出力は改善するがriseそのままではICTが長い |
| affinity-rise-v1 | 4 | 早すぎるriseはET/EFを失う。中間riseが有利 |
| affinity-volume-v1 | 4 | rise0.8/TBV5150とrise0.9/TBV5250がrest+reserve通過 |
| fine-v1 | 2 | 両候補を1ms coldで確認。前者はICT上限まで0.86msと近い |
| final-response-v1 | 3 | ±20%操作とR1.04の最終血圧調整を評価 |
| selected-fine-v1 | 1 | R1.04自身の1ms cold追試で全blocking rest通過 |
| selected-headroom-v1 | 2 | R1.04自身の実Tref±20%応答を確認 |
| source-transfer-v1 | 4 | Claudeのsource kinetics/Ca増量案。IRT160–180ms等が残る |
| transfer-velocity-v1 | 4 | source ratesでphi/bridge-exitを分離。ET/IRT改善とpeak-gradient/EFのtradeoff、全通過なし |
| selected-hr60-v1 | 1 | 同構成HR60を報告。RVEDVIだけ安静gateを外す |

source-transferを一般に否定したわけではない。比較した8条件では今の候補より完成度の高い代替にならず、候補到達後に無制限に探索を続けない判断とした。

## 数値品質・再実行性能

- 2ms/1msは同じconstruction SHA。結果/各checkpointは別。記録対象sourceも同一。
- LV/RVの正負4極値の2-grid差は1.55%、1.11%、3.30%、0.97%。最大極値の隣接区間も同程度の同符号傾きを持ち、単一segmentスパイクではない。5%/隣接50%という工学的数値screenを通過。収束次数や絶対精度の証明とはしない。[詳細](selected-pressure-rate-quality-final.json)
- 保存した1ms研究checkpointからfull-invariantで3周期再確認。lean時に保存した実際の次周期traceと完全一致し、period-1条件を保持。再確認は約6秒。最初のcold約153秒と区別する。[詳細](selected-checkpoint-qualification-v2.json)
- public Standard70としてのcheckpoint exportはしない。自構成で正確に復元し、別Tref/Ca/affinityへの復元を拒否する。
- researchの56tests + shapeの6tests = **62 tests passed**。TypeScript全体check、`git diff --check`も確認。
- 周期間の最大TBV誤差は約3e−12mL。保存則・単一Ca ownerを保持。検証用に波形を平滑化していない。
- 2–6個の独立数値workerを並列化。定常化の中間記録を軽量にし、最終拍/材料/固定tone端点だけを保存。新たな汎用optimizerや分散基盤は増設していない。

## 残課題と次の境界

1. **圧ピーク位置:** 1msでLVPは駆出時間の約76%、Ao nodeは約83%。二峰性は解消したが、正常中心のカテーテル波形と一致したとは言わない。心筋と血管storage/近位impedanceを分けて評価する。Claudeが指摘した既存recovered-root/Zc構成は、公開mint前の小さな比較候補。
2. **正常中央ではない指標:** mean PAP約20.9、LVEF55.1%、LV EDP約15.5、Tei0.61、高めの+dP/dt。判定方法・集団・条件を合わせた確認を残す。今ここで閾値を増減して隠さない。
3. **予備能:** 旧候補より実質改善したが、高容量圧負担とTref操作時の小さいCO変化は残る。広いpreset/patient-demo空間の検証は未完了。
4. **公開取り込み:** 候補を固定し、一つの版付きmaterial/Ca/vascular構成へ整理する。新しい研究スイッチをそのまま全部UIへ出さない。最新互換Surface/analysisと全parameter controllerを継承し、settled baseline・mint証拠・実ブラウザ波形を揃える。
5. **追加の永続変更:** 公開model identity/既定値/parameter domain/gateを変える具体的差分は、今回の候補支持と分けて、指定の外部1/2レビューを通す。

今は既定baselineやブラウザを切り替えていない。採用候補がない状態での無制限なfittingをいったん終え、再現・取り込みの対象を固定できる段階に進んだ。
