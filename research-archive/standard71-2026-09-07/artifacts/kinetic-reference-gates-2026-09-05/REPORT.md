# 元Caを保った参照長・反応速度の比較とgateの見直し

開始 2026-09-05、終了 2026-09-06 JST。研究用worktree内の結果であり、公開baseline・modelID・チェックポイントは変更していない。

## 結論

- 血圧を上げる能力そのものが欠けているわけではない。`kws`を原著値へ戻すとAoP/CIは上がる。しかし、同じ基準条件の最大等尺性張力に揃えてもETが大きく短くなり、AV勾配が悪化する。この方向をbaselineの解としては採用しない。
- Ca波形を変更せず、Landに渡す参照伸長を1.09から1.06へ下げる方向には、容量増加時の予備能を回復させる効果がある。1 msでも再現し、今回のLV伸長は高容量側を含めて長さ依存則のcap 1.2を下回った。
- ただし、その候補のETは233 ms、CIは2.919、AoPは114/77 mmHg。予備能だけが改善したことを理由にbaselineとして採用しない。高容量側の充満圧上昇もなお大きい。
- 「丸み・ピーク位置」の狭い範囲を必須正常域として扱う根拠はない。数値範囲は変更せず、今後の評価で参考警告へ分離した。一方、現在の0D構成で説明できないringing、弁の再開放、数値品質のチェックは維持した。

全測定値は[MEASUREMENTS.md](./MEASUREMENTS.md)、元JSONのSHA・再評価・圧寄与は[reassessment-and-accounting.json](./reassessment-and-accounting.json)。旧結果を新方針で上書きしていない。

## 今回の実験

1. 参照伸長1.09/1.07 × 原著反応速度の復元なし/`kuw`のみ/`kws`のみ/両方、計8条件。
2. 元Ca・現在の速度を固定し、参照伸長と5%張力増加をHR 60/70で比較、計8条件。
3. 有用な切り分け3条件について既存の固定制御・低/高容量プロトコルを適用。
4. 参照伸長1.06のbaseline容量と+12%容量を、1 ms・full-invariant・独立cold startで再確認。

HR以外の共通条件は、TBV 5050 mL（高容量5656、低容量4444）、systemic resistance 1.05、systemic compliance scale 0.6、Ao-SA慣性L=0、ventricular passive scale 1.04。AV EOA 3.5 cm²など弁条件は保持。後負荷試験は実施していない。L=0は前段階からの研究条件であり、今回初めて変更した因子ではない。

最大等尺性張力の基準は「HR70、幾何学的伸長1.1、現行材料、Tref190.08 kPa」。Trefの線形性から厳密に振幅を揃えた。これはヒトの正常張力の測定値ではない。同じ一点で張力を揃えても、他の長さ・短縮速度・閉ループで同じ収縮力になるという意味ではない。

各段階は独立workerで並列実行。8条件screenは約121秒、続く8条件は約73秒、3条件の予備能込みは約75秒、1 msの2条件は約173秒。大規模な最適化基盤は追加していない。

## 1. 原著速度を戻すと何が起きるか

原著whole-organ値は `kuw=182/s`、`kws=12/s`。現在の選択値は104/s、4.8/s。Aeff26.5、強結合解離の追加則（rate60/s、power16）、Ca波形は保持し、指定した速度とそこから導出される従属値だけを復元した。従って「原著モデル全体の再現」ではない。

参照伸長1.09、各々の等尺性最大張力を揃えた比較：

| 復元 | AoP mmHg | CI | ET ms | AV mean / peak PG mmHg |
| --- | --- | --- | --- | --- |
| なし | 112.8/76.6 | 2.910 | 248 | 4.37 / 8.42 |
| kuw | 114.6/77.3 | 2.954 | 240 | 4.94 / 11.19 |
| kws | 129.6/81.1 | 3.176 | 184 | 9.67 / 17.48 |
| 両方 | 133.1/81.9 | 3.229 | 170 | 11.81 / 23.07 |

他のfail項目は自動生成表を参照。この比較では全例で有意なLVP/AoPピークは1つ。単峰で見栄えがよいことも、ET・勾配の妥当性の代わりにはならない。

[実波形・PV loopの比較](./kinetic-contrast-2ms.png)。軸のクリッピングをチェックし、平滑化していない。

### 数理的な除外理由

現在のAVは、前向き流れで概ね `ΔP = R Q + B(A(t)) Q²` の代数的圧損失則を持つ。Rは非負、A(t)は最大EOA以下なので、正の駆出期間について

\[
\overline{\Delta P}\;\geq\;B(A_{\max})\left(\frac{SV}{ET}\right)^2
\]

が成り立つ（正の線形損失を捨て、Jensenの不等式を適用）。さらに実際の流量は一定でないため通常これより高い。

`kws`復元例のSV/ETでは、完全に平坦な流量を仮定した理想下限でも平均勾配は約7.12 mmHg。両速度復元例では8.63 mmHg。このSVとETとEOAを保ったまま、血管パラメータだけで平均勾配5 mmHg以下にすることは、このモデル式の下ではできない。

これは5 mmHgを普遍的臨床正常上限と証明する議論ではない。**採用中の低損失目標に対し、探索方向が構造的に不利だと判断する根拠**である。

## 2. 参照長の効果は張力を上げるだけとは違う

固定制御下、±12% TBV、2 ms：

| 条件 | 低容量CO減少 | 高容量CO増加 | 高容量LVEDV増加 | 高容量PCWP増加 |
| --- | --- | --- | --- | --- |
| 元参照長・張力+5% | 17.62% | 0.25% | 0.70 mL | 11.53 mmHg |
| 元参照長・kuw復元 | 17.69% | 0.59% | 1.28 mL | 11.47 mmHg |
| 参照伸長1.06・等尺性張力を一致 | 18.17% | 3.66% | 4.84 mL | 8.46 mmHg |

比較元の元参照長・190.08 kPaは前回試験で高容量CO−0.19%。1.07への変更では前回+2.51%。1.06では左右とも現行の方向応答gateを通ったが、これは3%等の設計上の最低余裕を満たしたという意味に限る。

### 1 msでの独立確認

| | baseline容量 | +12%容量 |
| --- | --- | --- |
| AoP | 113.96/76.55 | 120.81/81.63 mmHg |
| CI | 2.9187 | 3.0259 L/min/m² |
| ET | 233 | 243 ms |
| AV mPG / pPG | 4.991 / 9.418 | 4.867 / 8.927 mmHg |
| ICT / IRT | 49.14 / 95 | 46.14 / 78 ms |
| Tei | 0.619 | 0.511 |
| E/A | 0.804 | 1.622 |
| PCWP surrogate | 10.77 | 19.26 mmHg |
| LVEF | 0.525 | 0.527 |

独立coldのCO増加は3.671%。固定coronary toneを使うformal protocolの1 ms再認証とは区別する。両条件ともperiod-1に収束し、単峰、駆出後ピークの再上昇0、後半PV chord deficit 0。1 msでETはさらに3 ms短くなり、肺動脈弁mean gradientも現行境界をわずかに越えた。数値解像度の確認は「改善だけ」を探すためではない。

baseline容量で+/-dP/dtは+3270/−1561 mmHg/s。警告として残しており、狭い旧範囲に合わせるための平滑化はしていない。この候補のpressure-rate qualityについて専用の全項目再認証を行ったわけではない。

### 何が改善したか

同じCaを与えても、LandのCa感受性と残存張力は伸長に強く依存する。1 ms、高容量、cycle phase 0.7では：

- 元参照長：Land stretch1.15849、active pressure contribution13.13 mmHg。
- 1.06参照：stretch1.14366、active contribution7.81 mmHg。

Caは両者とも約0.19706 µM。Trefはむしろ増やしているのに、拡張期のactive成分が下がった。一方でpassive成分は3.61→5.03 mmHgへ増加し、総LVPは19.16→15.31 mmHg。圧を構成する項の実測であって、それぞれの「原因寄与率」ではない。

LVの1拍のLand伸長最大値は、元参照のbaseline/高容量で1.20655/1.21063、1.06参照で1.18765/1.19682。今回はCaを下げた前回候補と異なり、LVは両条件で1.2のcapより下に収まった。ただし、これは臓器幾何からLandへ渡す無次元伸長で、直接測定されたサルコメア長とは言えない。RV/SEPやより広いenvelopeの外挿妥当性は未確定。

[高容量での波形比較](./source-vs-reference-high-1ms.png)。最大global volume誤差は約2.8e−12 mL、coronary ledger誤差は約6.4e−10 mL。一周期一回の心室captureと一つのCa ownerを保持。

## 3. gateについて変更したこと・しなかったこと

### 変更したこと

- 今後の評価方針を`evaluation-roles-v2`とし、LVP/RVPの`rounded-not-plateau`を参考警告へ分離。中央部の圧変化比0.08–0.35、ピークindex0.2–0.8という元の数値はそのまま記録する。
- 有限値や0–1という測定量の数学的範囲は必須のまま。単峰・変動量・弁の再開放などのconstruction guardと分離。
- 新研究用診断では、sample indexではなく実時間でのピーク位置と、そこまでに駆出したvolume fractionを別々に測定。圧対時間と圧対volumeの曲率は同じではない。
- published baselineがpinする旧方針v1は、その方針のまま検証・表示。新しい警告方針を遡及適用しない。新方針の画面表示は「単峰」とし、参考・警告iconと説明へ丸み情報を分離する。

### 文献との照合

[Murgo 1980](https://scholars.uthscsa.edu/es/publications/aortic-input-impedance-in-normal-man-relationship-to-pressure-wav/)の著者所属機関掲載抄録は、人の大動脈圧形状と反射の関係を報告している。ただし、本モデルの振動を反射だと説明する根拠ではなく、LV/RVの今回の数値範囲を支持する資料でもない。

[Kohli 2017](https://physoc.onlinelibrary.wiley.com/doi/10.14814/phy2.13160)は本文・測定法とPDFの図4/5を確認した。実測PV loopの上辺に幅はあるが、LV機能正常の検査例には高血圧例も多く、健常baselineの形状分布を定義する研究ではない。図から新しい曲率の正常閾値を作らない。

### 変更していないことと残る判断

- AV/PV勾配：圧測定位置や流量依存性があり、臨床ASの閾値をそのまま「正常」とは呼べない。現行の低損失construction目標は保持。
- ET/ICT/IRT/Tei/E/A：観測法・HR・負荷の違いはregistryに保持。今回236→233 msを通すためにET下限を下げていない。TeiをICT/IRT/ETと独立な証拠として数えない。
- 予備能：3% CO/EDV増加等は普遍的正常範囲ではなく、非退行的な最低余裕として保持。低容量側と高容量側で対称な生理応答を仮定してはいけない。+12%TBVに対して+3.7%COかつPCWP+8.5 mmHgという結果は、gateを通っても豊富な余裕を証明しない。
- 圧・indexed volume・EF・CI/SVI：既存の観測法付きregistryを保持。高容量試験の圧上昇を安静正常域の一律gateで棄却しない一方、その高容量状態をbaselineには採用しない。

## 4. 次の方針

1. **単なるTBV/Tref上積みと、kws原著値への単純復元をbaseline探索の主方向から外す。** より高圧を作るだけの方向は、残存active tensionまたはET短縮とのトレードオフが大きい。
2. **参照長を生理的に解釈できる設定と、拡張期に残るactive成分を中心に検討する。** 1.06を「正解」と固定せず、対応する力–長さ・Ca–張力・周期力波形を併記する。新しいstateはまだ不要。
3. **次の限定実験では、Ca波形を保ちながらETを延ばす変更が、高容量の残存張力を再増大させないかを切り分ける。** まず固定伸長・処方した短縮履歴による軽量component試験を使い、力の発生と解離を見てから少数だけ閉ループへ戻す。動態を全部一緒に変えてfittingしない。
4. 勾配の解析下限、予備能、ET、圧上昇/下降、波形を併用し、成立しない方向を早めに除外する。予備能gate合格を停止条件にせず、圧/CI中央域と実験余裕の両立を確認してからbaseline採用を判断する。

今回は新たな利用者判断を必要とする設計拡張は行っていない。新しいCa source、独立したLV/RV kinetic family、広い強収縮の公称domainなどを導入する前には、別途その必要性を示す。

## 再現と実装

`component-and-jobs.ts`、`make-reference-followup.mjs`、`make-reserve-jobs.mjs`、`make-confirmation-jobs.mjs`が入力を生成する。`tools/scientific/runMainWireBaselineReferenceDesignV1.ts`で新規出力dirへ実行。各dirはprotocol、入力、source snapshot、構成のidentity、settlement、terminal trace、material readbackを保持する。`summarize.ts`は元結果を変更せず別ファイルに集計。図は`render-comparison.mjs`でaccepted endpointsを描画。

exact checkpoint/stateスキーマ、Ca owner、公開defaultは不変。研究fixtureに離散的な原著速度復元を追加した。source/testsを正として、恒久READMEにはこの実験経過を重複記載しない。

最終確認：関連16ファイル・250テストが成功（baseline読み込み、Workbench表示、旧/新評価方針、fitting、圧微分品質、型付きruntimeを含む）。`tsc --noEmit`、`git diff --check`も成功。全repositoryテストや、新候補の公開mint認証を完了したという意味ではない。公開baseline JSONとmodel identity定義に差分がないことを確認した。
