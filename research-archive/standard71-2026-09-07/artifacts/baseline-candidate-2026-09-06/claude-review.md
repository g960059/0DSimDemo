以下、read-onlyで原コード・原データ・reportを読んだ上での独立見解です。編集・計算・git操作は行っていません。

## 総合判定

最先端研究構成（Ao 121/82、CI 3.01、ET 247 ms、Tref 239 kPa）は、正常baselineとして推奨しません。血圧とCIは中央に来ましたが、時相・拡張・肺圧はほぼ全gateの境界上にあり、正常「中央」ではなく「軽度拡張障害＋短い駆出」の表現型です。

| 指標 | 候補 | 健常中心の目安 |
| --- | ---: | ---: |
| ET at HR70 | 247 ms | 約295 ms（Weissler男性式 413−1.7×HR） |
| IRT | 103 ms | 70–90 ms |
| Tei | 0.587 | 0.39±0.05 |
| E/A | 0.81 | 1.2–1.5 |
| PAP sys/dia | 31.7/14.7 | 21±4 / 9±3 |
| LV +dP/dt | 3143 | 1700±400 |
| 高容量側 dP/dV（PCWP/EDV） | 約1.4 mmHg/mL | 0.1–0.3 |

Tref 239 kPa、高容量CO +3.7%、充満圧負担は独立の問題ではなく、同じ一つの構造的誤りの症状だと判断します。

## 根本原因の仮説：長さ依存Ca感受性のintact移植

原コード `engine/myocardium/myofilament/land2017/equations.ts` の `CaT50 = CaT50Ref + beta1·(min(λ,1.2)−1)` を、parameterSetsの値で評価すると次の通りです。

- Land原著はskinned校正で CaT50Ref 2.5 µM・β1 −2.4 µM を得て、intact移植で CaT50Ref を 0.805 に下げた際 β1 を絶対値のまま保持しています。相対感受性 β1/CaT50Ref は 3.1 倍に跳ね上がり、λ 1.0→1.2 で CaT50 が 0.805→0.325、ΔpCa50 ≈ 0.39 になります。原著skinnedの相対値は ≈0.09、Tanner 2023 の donor 37°C は ≈0.07 です。reportもこの事実を確認済みですが、修正幅が β1×0.8 に留まっています。
- この急峻さが4つの症状を同時に生みます。第一に、駆出中の短縮で CaT50 が急上昇し力が崩れるため AoV が早く閉じ、ET が短く早期流量と AV 勾配が上がる。第二に、拡張期 λ≈1.2 で floor Ca 0.164 / CaT50 0.325 = 0.5 → CaTRPN≈0.2 → 私の概算で permissive 分画 ≈2%、残存力 ≈10 kPa。reportの source replay 12.2 kPa と整合します。第三に、cap 1.2 で前負荷応答が頭打ちになる。第四に、動作長でしか活性化が立たないため、遅い kws 0.4× と Tref 2× で補償が必要になる。
- 研究で試した案A（λ=1.166 で CaT50 を固定して傾きを緩める）が充満期の能動圧を増やしたのは当然です。短い長さ側の CaT50 が下がり、Ca尾が残る早期充満で活性化が増えます。正しい固定点は「全長さで Ca_floor/CaT50 を小さく保つ」ことで、それは Ca 振幅の解放を要求します。
- Ca 振幅の digitized-lock（peak 0.593、floor 0.164、比 3.6）は人の正常値としての地位を持ちません。Land 自身が Ca と力を別標本から合成しており、Fura系の絶対較正は2倍程度ぶれます。intact ヒト心筋の peak/floor 比は 5–10 が典型です。

つまり Tref・Ca振幅・CaT50Ref・β1 は識別不能の同一族で、現在は最も測定根拠のある Tref を浮かせ、最も根拠の弱い Ca 振幅と β1 を固定しています。逆にすべきです。

## 提案・反証試験・永続変更の可否

**提案1（本命、材料の再パラメータ化、状態数は増やさない）**

1. β1 を相対感受性で移植し直す。β1 = −2.4 × 0.805/2.5 ≈ −0.77 µM。許容域は ΔpCa50 0.07–0.15 per 0.2λ。
2. Tref を原著 whole-organ 120 kPa に固定し、kuw/kws を原著 182/12 に戻し、bridge-exit 拡張と Aeff 1.06 を撤去する。ET 延長を遅い架橋速度に頼らなくなるので、IRT も自然に短くなるはずです。
3. Ca 振幅を解放し、Ca_peak/CaT50Ref と Ca_floor/CaT50Ref の2比だけを校正座標にする。目安は peak 0.8–1.2 µM、floor 0.10–0.16 µM。
4. landSlackStretch を 1.0 にし、EDV 144 mL で λ=1.1、cap まで +9% の headroom を持たせる。Frank-Starling 利得は h(λ) の β0 側が担います。
5. passive scale は 1.0 近傍へ戻す。1.248 は収縮不足を EDV 縮小で隠して EF を作る補償で、充満圧負担の直接原因です。

反証試験は component で数秒、closed loop は少数で足ります。

- 等尺性 twitch λ=1.0/1.1/1.2：ピーク比 1.0→1.2 が 1.5–1.9、λ=1.2 の拡張期残存力がピークの 3% 未満。現行は約 24%。
- 記録済み駆出軌道の仕事が現行の 0.9 倍以上、短縮停止後 100 ms の残存張力 25% 以下。
- closed loop で ET 270–300、IRT 70–90、E/A > 1.0、Tref ≤ 160 kPa、高容量 CO +6% 以上かつ PCWP 上昇 ≤ 6 mmHg。
- 等尺性が合っても closed loop の ET が 250 未満に留まれば、β1 仮説は棄却で、責任は Aeff/φ の速度項へ移ります。それが「次の唯一の材料比較」であるべきで、population-moment や 3 状態化ではありません。

**提案2（循環側、提案1と独立に採用可）**

動脈 PV 則の振幅 0.6 は介入ではなく生理的補正です。`topology.ts` の Ao/SA/Art の Vs 合計 670 mL を stiffness 1.42 で割った VsEff 472 mL は、P0+P=140 で dV/dP ≈ 3.4 mL/mmHg となり、公開 baseline の脈圧 24 mmHg（99/75）はこの結果です。0.6 倍で ≈2.0 mL/mmHg、Chemla 1998 の SV/PP 1.46±0.69 と若年健常 1.5–2.0 に一致します。式が VsEff = Vs/stiffness × scale なので、research scale を廃止して arterialStiffness ≈ 2.4 として一本化できます。Rsys 1.10・TBV 5200 も通常座標です。SVR は約 16 mmHg·min/L で正常です。

**不合理な自己制約**

- research fixture の離散集合 β1 {0.8,1}、Ca floor {0.11,0.13,0.164}、slack {1,1.06,1.07,1.09}、Tref 95–240 kPa。物理的根拠のある β1 ≈ 0.32× が探索不可能になっています。
- Tref を fitting 座標にすること自体。上限を 240 に広げる議論は不要で、120 固定が正しい。
- ET 下限 240、Tei 上限 0.65 は異常域まで admit します。gate はそのままでも、HR70 の中心目標 ET 280–300、Tei ≈0.4 を「目標」として明記すべきです。
- preload floor +3% は非退行の最低限で、固定制御下 TBV +12% は stressed volume +40% 相当の大負荷です。%CO ではなく、EDV での chamber stiffness と ΔSV/ΔEDV を報告量にすべきです。
- AV 勾配 gate mean ≤5 は、回復なしのノード差＝Doppler 相当としては妥当です。ただし SV/ET を二次で縛るので、ET が 290 になれば自動的に 3.5 程度へ落ちます。gate を緩める必要はありません。

**永続変更として支持するもの**

- 動脈振幅 ≈0.6 相当を baseline 座標へ格上げし、二重オーナーを解消する。
- β1 の連続値と Ca 振幅解放を研究 fixture に許可し、Tref を 120 kPa 固定へ戻す。
- Rsys 1.10 / TBV 5200 級の再中心化。
- ET・Tei の中心目標を評価 registry に記録する。

**支持しないもの**

- 現研究構成（Tref 239、β1 −1.92、passive 1.248、Ca×1.1）の baseline 採用。
- Tref 上限拡張、Ca 時間幅×1.1 単独、passive 1.248 の温存。
- population-moment、3 状態、bridge-exit 拡張を baseline 経路に載せること。いずれも症状に対する追加機構で、原因である活性化の移植を直していません。

最終候補結果が届いたら、上の反証試験の数値で再評価します。

Sources:
- [Tanner et al. 2023, J Gen Physiol, sarcomere length and Ca sensitivity in donor myocardium](https://pubmed.ncbi.nlm.nih.gov/36633584/)
- [Land et al. 2017, human contraction model](https://doi.org/10.1016/j.yjmcc.2017.03.008)
- [Chemla et al. 1998, total arterial compliance by SV/PP](https://journals.physiology.org/doi/full/10.1152/ajpheart.1998.274.2.H500)
- [Alhakak et al. 2021, LVET heart-rate correction from Weissler](https://onlinelibrary.wiley.com/doi/10.1002/ejhf.2125)
- [Alhakak et al. 2023, Copenhagen cardiac time intervals](https://link.springer.com/article/10.1007/s00392-023-02269-2)
- [Tei index normal values](https://reference.medscape.com/calculator/162/myocardial-performance-index-co-and-et)
- [Fujimoto et al. 2013, rapid saline loading](https://pubmed.ncbi.nlm.nih.gov/23172838/)
