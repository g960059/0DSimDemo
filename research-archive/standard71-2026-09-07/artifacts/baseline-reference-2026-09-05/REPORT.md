# Baseline reference / intervention study — 2026-09-05

## 結論と採用状態

研究構成でAoPを約105/77 mmHgへ上げ、安静時の既存チェック、低・高容量側の固定制御preload reserve、HR60での安静時チェック、coldと既存baseline継続からの初期状態比較、1 ms刻みの安静時チェックを通る候補が得られました。本番baseline・modelID・Surface・UIは変更していません。これは構成上の候補で、唯一の生理的正解や独立した臨床検証を意味しません。

血圧は改善しましたが、CIは-0.63%、LVEFや高容量側予備能もわずかに低下しています。したがって旧baselineを全指標で上回る候補ではなく、CIが大幅に上がったとも主張しません。数値合格だけで自動mintしない方針です。

## 実装した最小構成

- 能動張力は心室共通の絶対Trefで校正し、研究fixtureでは重複するactive倍率を1に固定。
- 体循環動脈のvolume-law amplitude/complianceをAo・SA・Artだけで調整。PA・PArtの構成則は変更しない。
- Ca source、Land反応速度、形状、弁、AVのL、新しいstateは変更・追加しない。受動硬さは既存の座標で小幅に試したが、最終候補では変更しない。
- 既存の正確な継続・period-1判定・軽量実行・固定冠動脈toneのreservoir closure検証を再利用。研究構成をStandard70のcheckpointとして偽装しない。
- 校正用範囲と介入端点を試す範囲を分離。どちらも工学上の探索範囲であり、ヒトの正常範囲ではない。
- 240 msが大きな絶対時刻同士の減算で0.23999999999995秒となる比較上の不具合を修正。測定値・生理的閾値を変えず、観測・gate・監査の比較規則を揃えた。

## 候補のパラメータ

Tref: 158.4 → 166.32 kPa（+5%）、体循環compliance倍率: 1 → 0.8、systemic resistance入力: 1.01 → 1.10（+8.91%）、TBV: 5050 → 4950 mL。HR70、心室受動硬さ1.04、既存の肺循環設定などは据え置きです。全構成は[candidate-evidence.json](candidate-evidence.json)に保存。

従来のactive scaleは1.32、許容上限1.33で、上方向の余地は0.76%でした。表示だけを1へ変更してもこの制限は消えません。研究構成では絶対Trefと相対介入を分け、候補のTref 166.32 kPaに対して±20%の端点を実計算しました。これは全区間・全パラメータ組合せの保証や、臨床的な収縮予備能の測定ではありません。

## 比較

| 指標 | 現行baselineの再計算 | 研究候補（2 ms） |
|---|---:|---:|
| AoP max/min (mmHg) | 98.84/74.76 | 104.66/77.35 |
| AoP mean / pulse (mmHg) | 85.17/24.08 | 90.08/27.31 |
| CI (L/min/m²) | 2.733 | 2.716 |
| SV (mL) | 74.19 | 73.72 |
| LVEF / RVEF | 52.69%/49.71% | 52.31%/50.23% |
| PCWP surrogate / CVP (mmHg) | 9.66/3.40 | 9.77/3.33 |
| AV ET (ms) | 244 | 244 |
| AV raw mean / peak gradient (mmHg) | 3.94/6.88 | 3.90/6.58 |
| ICT / IRT (ms) | 63.14/88.00 | 63.14/92.00 |
| Tei / mitral flow E/A | 0.619/0.820 | 0.636/0.804 |
| LV +dP/dt / −dP/dt (mmHg/s) | 2587/-1306 | 2745/-1391 |
| Fixed-tone +12% TBV: LV ΔCO/CO | 4.33% | 3.83% |

[波形・PV loop比較](reference-vs-balanced.png)。描画用の平滑化は行っていません。単峰性／plateauは既存の数値sentinelでの結果で、微小な駆出後半の内向き曲率の問題を解決したという主張ではありません。AV勾配はLV−Ao node差で、Dopplerや圧回復後のカテーテル差へ読み替えていません。

## 主な試行と分かったこと

1. Tref×体循環complianceの3×3試験：張力+20%だけではAoP上昇は約3 mmHg。ET短縮とE/A低下が生じるため、張力を上限へ押すだけの方向は採らない。
2. Rを加えた8条件：Tref+10%、C−20%、R+8.91%、TBV5050でAoP約108/80、安静時チェックは通過。しかし高容量側ΔCO/CO=1.46%、PCWP約10.5→21.0で予備能不合格。棄却した。
3. この候補からCをさらに20%低下（現行比0.64）するとLVPのsignificant peakが2になった。[波形](compliance-boundary.png)。これは二峰性検出であり、原因を数値不安定やLだけと断定していない。この範囲を検証済みの正常操作域として採用しない。
4. TBVを100 mL低下すると高容量側予備能が回復。受動硬さ1.04→0.96の効果は小さく、積極的には採用しなかった。
5. 張力を+5%へ戻し、ET/E/A/予備能を同時に確認した候補を固定。ここから先の広いgrid探索は実施していない。

数学的な解釈：このcompliance変更は接線だけでなく血管のV(P)も変えます。全対象動脈を共通の90 mmHgに置いた構成則上の例では、C−20%に伴う収納容量の差は約98.3 mLです。実際の各nodeの定常圧・体内血液分布の測定値ではありませんが、TBV約100 mLの減量が必要になった方向を説明します。C、TBV、前負荷を独立な効果として扱うべきではありません。

## 確認試験と限界

- HR60: AoP 101.15/72.33、CI 2.578、PCWP 11.65、既存安静時チェック通過。
- 別初期状態: AoP max差 0.0045 mmHg、CI差 0.0012 L/min/m²。ともにperiod-1。
- 1 ms/full-invariant: ET 243 ms、AV mean 3.946 mmHg、E/A 0.8039、Tei 0.6426。安静時チェック通過。二刻みの整合性であり連続時間解の精度証明ではない。
- LV/RVの正負dP/dtは全て記録。二刻み差と隣接segmentのデータは[JSON](candidate-evidence.json)に保存。これは未mintの研究構成の診断で、公開モデルのcheckpoint付き必須gateを置き換えていない。
- 張力−20%: EF 48.77%、ET 256 ms。+20%: EF 54.74%、ET 236 ms、E/A 0.776。いずれも定常化し、LVP/RVPの単峰性sentinelを通過。介入後まで安静時EF/ET/E/Aの範囲内に置くことは採択条件にしていない。
- E/A・EF・ETの基準に対する余裕は大きくない。任意の広いenvelopeで全て正常域という主張はしない。
- 後負荷ストレス試験は追加していない。Rの変更はbaseline校正の試行。

## 実行速度・来歴

独立な生理条件数ではなく再計算を含む40件の実行記録があります。最初の9条件は約70秒、最後の4候補はpreload reserveを含め約70秒（4並列、当該Macでの実測）。人間・AIの考察時間を含む作業全体の所要時間ではありません。

高速化は既存機構の再利用が中心です。初期値1種類が常に最速ではなく、今回の候補ではcoldが28周期、既存baselineからの継続が115周期でした。warm startを無条件に優先せず、最終点を別初期状態でも比較しています。

各stageのprotocol、raw trace、判定履歴、失敗理由は[runs](runs/)に保存。最初の17件はソースhashと構成記録のみで、dirty source全文snapshotはありません。後半の確認・再試行には全文snapshotを保存しています。探索後に選んだ構成証拠であり、独立検証データではありません。現時点ではローカル成果物で、GitHubへpush済みという意味ではありません。

再計算（出力先は未作成のpathにする）:

```sh
npx vite-node --script tools/scientific/runMainWireBaselineReferenceDesignV1.ts --jobs artifacts/baseline-reference-2026-09-05/candidate-jobs.json --output artifacts/baseline-reference-replay --workers 1
```

## 次の最小取り込みの境界

研究fixtureをそのままproductionへ露出しない。校正した物理parameterと、baseline=1の介入倍率の所有者を整理してから、互換な最新Surface/analysisを継承したexact modelとして扱う。公開control domain全域の確認、正規checkpoint・数値品質証拠との結合、ブラウザ操作の回帰を済ませるまでmodelIDのmintやbaselineの差替えは行わない。この候補のCI改善は実質的に得られていないため、全面的に優れたbaselineとして扱わない。

## 文献との接続

- [Land et al., 2017](https://doi.org/10.1016/j.yjmcc.2017.03.008): 心筋モデルの出発点。今回のTref探索上下限をヒトの正常範囲として支持する資料ではない。
- [Chemla et al., 1998](https://journals.physiology.org/doi/10.1152/ajpheart.1998.274.2.h500): 中心大動脈圧とSV/PPによるcompliance推定のヒト研究。病態を含む小標本であり、普遍的な正常範囲とはしない。
- [Haluska et al., 2010](https://www.nature.com/articles/jhh200992): complianceの推定法による系統差。モデルの各nodeの接線complianceと臨床の推定TACを同一視しない。
