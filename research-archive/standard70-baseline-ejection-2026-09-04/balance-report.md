> Archival reading copy. Original bytes, figures, linked run files and source paths are preserved in `raw-evidence.tar.gz`; relative links below refer to the original directory inside that archive. This copy only replaces the machine-local worktree path.

# LV駆出後半の圧・心筋・血管収支の分解

2026-09-04。研究worktree: `<research-worktree>`、実行HEAD `8c8bcdb0` + protocolにSHAを記録した未commitの解析コード。

## 結論と判断

**現在の軌道上で、後半の小さな内向きの曲がりに何が寄与しているかを切り分けた。受理済みの生データに存在し、0.25 msまでの精細化でも消失しなかったが、生理的な異常とはまだ判定できない。形を丸くするための数理モデル変更は採用しない。**

- LV圧を心筋側から再構成すると、後半は能動応力の低下と、容積減少・共有形状変化による圧生成係数の増加が大きく相殺している。
- 気になる局所形状に対しては、伸展時に加わる受動張力が短縮で減少する成分の寄与が大きい。負の受動応力そのものが凹みの主因という説明は支持されない。
- 血管側から同じ圧を見ると、Aoの流出が流入を上回ってAo圧が下がる局面に対応する。これと心筋側の説明は、同じ連成解の異なる収支表示であり、独立した原因を足し合わせたものではない。
- 0.25 msまで刻みを細かくしても局所の負のchord残差は残った。正負を表示補間が作り出したとは考えにくい。一方、これを「正常なヒトのPV loopなら許されない形」とする文献的閾値は得られていない。

前回の固定AV流路L案は不採用のまま。今回もCa、Land、受動構成則、血管パラメータ、登録baseline、公開modelID、Surface、mint gate、画面表示を変更していない。

## 1. 実際に追加したもの

既存の研究audit CLIに、受理済みステップの心室共有形状、心筋応力成分、Ao/SAの容積・圧・流量、冠血流のreadbackを追加した。心筋や循環を二重に進めず、既存のgeometry式を受理済み状態で評価するだけである。

小さい純粋解析helperは、次の二つだけを行う。

1. 有限時間区間での積の変化を、対称な積則で厳密に分解する。
2. Aoの全流入・流出と容積変化、非線形PV則による圧変化を対応させる。

さらに、既存の研究用cycle実行入口だけで0.5/0.25 msの精細化を許した。通常cycleとqualificationの最小dt・ポリシー・上限は変更していない。研究の有限ステップ上限は刻みに比例させ、イベント所有・血液量保存・all-off条件等の検査は共有する。新しいcheckpoint形式やmodelIDは作っていない。

## 2. 何を測ったか

最終データは以下の4実行。各3周期、心拍数70、パラメータ固定である。

| 実行 | 初期状態 | 計測・解析時間※ | 受動移行域内の受理サンプル数 |
|---|---|---:|---:|
| [2 ms](./verified-2ms/summary.json) | 登録baselineのcheckpoint | 3.61秒 | 0 |
| [1 ms](./verified-1ms/summary.json) | 既存1 ms refined checkpoint | 6.48秒 | 1 |
| [0.5 ms](./verified-0_5ms/summary.json) | 同じ1 ms refined checkpoint | 11.89秒 | 3 |
| [0.25 ms](./verified-0_25ms/summary.json) | 同じ1 ms refined checkpoint | 22.93秒 | 5 |

※並列実行時のscript内部時間。プロセス起動・fixture作成・checkpoint復元・最終ファイル書き出し時間は含まない。定常化を最初からやり直していない。

1/0.5/0.25 msは同一checkpointからの同じ長さの軌道比較であり、精細化ごとの新しい周期定常解の認証ではない。2 msは別の既存checkpointなので、2→1 msの差を純粋な刻み誤差とは呼ばない。

解析対象は実際の完成拍内の順方向駆出。境界のQ=0点は差分・血管収支の対象から除いた。部分区間は、駆出量の60–85%が排出された範囲を使う。**ETの60–85%という意味ではない。** このbaselineではAV開放から約121–180 ms、LV容積約96–78 mLに対応する。これも事前に選んだ記述用の窓で、臨床的正常範囲ではない。

## 3. 心筋側の厳密な分解

TriSegの実装で、LV transmural pressureは

\[
P_{LV,tm}=g\tau_{LVFW},\qquad
g=-\frac{V_{wall,LVFW}}{133.322}\frac{\partial e_{LVFW}}{\partial V_{cap,LVFW}}
\]

となる。応力はKirchhoff stress（Pa）、gはmmHg/Pa。有限厚さの幾何学項を含む実装の微分を使っており、薄壁の単純なLaplace式で置き換えていない。SEP/RVは解かれた共有形状を介してLVに影響する。SEP圧やRV圧をさらにLVへ足すわけではない。

固定された受理geometryで、能動・受動・SLSの各応力にgを掛けると、LV transmural圧を再構成できる。胸腔内圧と心膜excess圧はそれぞれ一度だけ加える。このbaselineでは両外圧はゼロだった。

変化量は、各受理区間について

\[
\Delta P_{tm}=\bar g\Delta\tau_a+\bar g\Delta\tau_p+\bar g\Delta\tau_{SLS}
+\bar\tau_{total}\Delta g
\]

と分けた。barは区間両端の平均。これは厳密な代数的配分であって、各成分を独立に変えた場合の因果効果ではない。

0.25 ms、上記後半窓の変化量は以下だった。

| 圧変化への寄与 | mmHg |
|---|---:|
| 能動応力の変化 | −16.377 |
| geometry係数の変化 | +14.737 |
| 受動応力の変化 | −0.484 |
| SLS応力の変化 | −1.186 |
| 合計LV圧変化 | −3.309 |

したがって、上辺が比較的平坦であることを「Caまたは能動応力が一定だから」と説明するのは誤りである。能動応力は下がっているが、圧への変換係数が上がっており、両者の大部分が相殺している。この連成自体が不適切と判定したわけではない。

## 4. 小さな凹みの内訳

この窓の両端を結ぶ直線から、中間容積の圧がどれだけ上下に離れるかを記録した。正は上側、負は下側。局所の二階微分や臨床的な「曲率正常値」ではない。

| dt | LV全体 | 能動圧 | 受動圧 | SLS圧 |
|---|---:|---:|---:|---:|
| 2 ms | −0.10158 | +0.02453 | −0.17837 | +0.05226 |
| 1 ms | −0.14104 | −0.01269 | −0.18088 | +0.05252 |
| 0.5 ms | −0.16195 | −0.03235 | −0.18228 | +0.05268 |
| 0.25 ms | −0.17264 | −0.04240 | −0.18299 | +0.05275 |

単位はmmHg。1→0.5→0.25 msでLV残差の差は約0.0209→0.0107 mmHgへ小さくなる。局所の負の形は消えないが、連続時間の高階微分まで検証したとは言わない。

### 受動応力のどの部分か

現行の心室受動則はMoyerではなく、Klotzの臓器EDPVRを参考にした固定構成候補である。Moyerは心房側で使用されている。心室の受動エネルギーは正の中央剛性と伸展時のrecruitmentを持ち、応力はエネルギーの微分である。

現在のscale1.04では、geometry log strain e≤0で受動応力は1248e Paとなる。負の応力をclampしておらず、圧縮時にも正の接線剛性が残る。e=0は「剛性がゼロになる点」ではない。

受動圧をこの中央線形項と伸展recruitment項にさらに分けると、0.25 msのchord残差は

- 中央項（負側も含む）：**+0.00614 mmHg**
- 伸展recruitment項：**−0.18913 mmHg**

だった。したがって、「負の受動応力を消す」という修正は今回の観察からは筋が通らない。伸展で加わっていた張力が短縮で減る成分は、現在の軌道上のこの代数的内訳で最大の負寄与を持つ。独立した因果効果の測定ではない。

recruitmentの移行幅はlog strain 0–0.001。0.25 msの受理点から補間した通過時間は約1.277 ms。2 msでは移行域の内部に受理点がなく、1 msでは1点だった。ただし全体の刻み依存性をこの移行だけに帰属する実験はしていない。現行のエネルギーと応力・接線は連続で、ここで不連続な応力ジャンプやclipを発見したわけでもない。

## 5. 同じ現象を血管側から見る

\[
P_{LV,abs}=P_{Ao,abs}+\Delta P_{AV,raw}
\]

0.25 msの後半chord残差は、LV −0.17264 = Ao −0.35259 + raw AV差 +0.17995 mmHg。弁の圧差成分は、Ao側の負の曲がりを部分的に打ち消している。

Aoの貯留は、実際のBE式に合わせて

\[
\Delta V_{Ao}=h(Q_{AV}-Q_{Ao\to SA}-Q_{coronary}+Q_{other})+r_V
\]

と分けた。冠血流は実際のconservative companion境界から取得し、non-coronary graphとの重複はない。デバイス流も明示的all-offを検査した。非線形PV則には実際の有限区間のsecantを使い、単一時点のcomplianceを有限ΔVへそのまま掛けていない。solver残差rVは数値項として別に記録した。

0.25 ms、後半のAo圧変化−1.90446 mmHgは、AVからの流入+25.87059、Ao→SAへの流出−27.62547、冠血流−0.14957 mmHgに分かれた。ここでも、これらは同じ軌道の収支であり、血管だけが心筋から独立して形を決めたという意味ではない。

Ao→SAに元からあるL=0.002と抵抗の運動量式も受理区間で照合した。前回の追加AV L実験は今回には含めていない。

## 6. 文献が支持すること・しないこと

完全弛緩させた犬LVのvolume-clamp実験では、正だけでなく負の受動圧も測定されている。これは心室の復元力を支持するが、収縮期のヒトPV上辺の曲率基準ではない。[Nikolić et al., 1988](https://pubmed.ncbi.nlm.nih.gov/3383365/)

単離mouse心筋細胞でactomyosinを阻害した実験でも、機械的slackをまたぐ負のrestoring stressと正のpassive stressが測定され、近傍の両側剛性は類似していた。これは負の受動力を除去しない根拠となる一方、この0D心室の係数・移行幅にそのまま移植できる値ではない。[King et al., 2011](https://pmc.ncbi.nlm.nih.gov/articles/PMC3010058/)

高忠実度LV圧・容積の161 loops/13例を扱った研究にも、今回使った後半chord残差の正常閾値はない。観察図の「ふっくらした印象」と微小な局所残差の異常判定は分ける必要がある。[Kohli & Kovács, 2017](https://pubmed.ncbi.nlm.nih.gov/28351966/)

独自の数理的判断として、負の応力は受動性違反ではない。エネルギー最小より短縮した側でエネルギー勾配が負になるのは復元ばねとして自然である。また、生体だから必ず特定のC1/C2/C3連続性を持つ、とは言えない。現行の構成則が数学的に連続でも、その係数と移行幅が独立したヒト組織データで同定されているわけではない。

## 7. 検証と再現性

- 心筋応力・geometryからのLV圧再構成残差：全条件で2.85×10⁻¹⁴ mmHg未満。
- 積の変化量配分と局所chordの和は、数値精度内で閉じた。
- 最大Ao単区間容積残差は約3×10⁻⁸ mL。残差を流入・流出へ吸収せず、累積数値項として保持した。
- Ao→SA運動量残差：最大7.6×10⁻¹³ mmHg未満。
- 全4実行で3周期を完走し、既存のイベント・all-off・血液量保存等の検査を通過。
- 前回の未変更canonical軌道と重なる2 msの866点、1 msの1724点で、圧・容積・弁流量・free Ca・時刻・受理dtはJSON値で完全一致。計測追加でこの軌道が変わっていないことを確認した。
- 各最終protocolに記録した13 source SHAは、この段階の最終実装と一致。過去の出力は当時のsource snapshotとして保持し、後からの実装の結果と混同しない。
- 新旧研究helper・弁則・状態所有・suite登録の59 tests passed。研究cycleの通常経路同等性・0.5/0.25 ms精細化の3 tests passed（同ファイルの他5件は選択実行では未実行）。合計62件。型検査、diff check成功。

途中の`replay-*`は細分解追加前、`final-1ms`は新設した累積収支の検査が、solver残差を別項に累積していなかったため停止した記録である。閾値を緩めず、数値残差の項を明示してから`verified-*`へ再実行した。失敗や途中のファイルは上書きしていない。

再実行例（研究worktreeをcwdにし、未作成のoutput directoryを指定）:

```sh
npx vite-node --script tools/scientific/auditMainWireEjectionCouplingV1.ts \
  --output /tmp/new-ejection-balance-run \
  --evaluation /tmp/main-wire-baseline-fit-current.5Y0SEd/final-fast-v7/0.qualification-refined.json \
  --request /tmp/main-wire-baseline-fit-current.5Y0SEd/final-fast-v7/0.request.json \
  --replay-cycles 3 --dt-sec .00025
```

登録baselineの2 ms計測はevaluation/requestを省略し、`--dt-sec .002`とする。

## 8. 今後の扱い

この局所形状については、原因の候補を増やす探索をいったん打ち切る。今回の知見を理由に、Ca/Land、TBV、血管complianceを丸さへ向けてfittingしない。負の受動応力を消さず、mint gateへ新たな曲率閾値を追加しない。

受動材料則を今後検討するなら、独立した材料上の問題として、伸展・復元の両側、臓器EDPVR、共有geometryとの整合を評価する。その際は基準長・エネルギー・遠方の剛性をむやみに動かさず、候補が必要と判断できてから小数の対照を行う。採否にはET・弁勾配・dP/dt・E/A・充満圧・preload reserveなど既存指標への副作用も確認する。局所の0.1–0.2 mmHgの凹みを消せたことだけを採用理由にしない。

今回の数値モデルは未変更。図は[0.25 msの寄与分解](./verified-0_25ms/balances.png)、元の圧・流量・Ca・PV表示は[同時計測SVG](./verified-0_25ms/waveforms.svg)。全受理データは各directoryの`result.json`に保存している。
