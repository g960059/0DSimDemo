> Archival reading copy. Original bytes, figures, linked run files and source paths are preserved in `raw-evidence.tar.gz`; relative links below refer to the original directory inside that archive. This copy only replaces the machine-local worktree path.

# LV駆出波形：圧・流量の同時計測と固定流路慣性の連成比較

2026-09-04。研究worktree: `<research-worktree>`。実行時HEAD `8c8bcdb0` + 各protocolに記録した未commitの研究コード。公開modelID、登録baseline、Surface、mint gateは変更していない。

## 結論

今回の固定Lと既存opening lawの組み合わせでは、**順方向流が残る間の負のLV–Ao圧差を表現できたが、PV上辺の凹み・早い流量ピークを解決しなかった**。この案をbaseline改善として採用しない。慣性一般が不要、あるいは他の流路・係数でも改善不可能と結論するものではない。

PV loopを見た目のために丸めたり、圧波形に補正を加えたりしていない。計算ステップで受理された圧・流量・容積を比較した。

## 1. 現行モデルの同時計測

定常checkpointから、既存のイベント境界を尊重する実行経路で2周期だけ追加計測した。2 ms、1 msを別プロセスで実行。1 msは既存のrefined checkpointを使用した。追加計測は各約2–4秒で、定常化をやり直していない。

| AV開放からの時刻 | 2 ms | 1 ms |
|---|---:|---:|
| AV流量ピーク | 32 ms | 30 ms |
| Q / 同時刻の有効弁口面積のピーク | 28 ms | 27 ms |
| LV自由壁のactive stressピーク | 62 ms | 62 ms |
| LV圧ピーク | 92 ms | 89 ms |
| Ao→SA流量ピーク | 116 ms | 115 ms |

異なる物理量のピークは同時ではない。特に、QのピークをそのままDoppler jet velocityのATと呼ばない。今回のnative velocity readbackも、実測DopplerではなくQ/EOAである。

現行AoVはopening memoryを持つが、流量の慣性状態は持たない。一方、Ao→SAには既にL=0.002 mmHg·s²/mLがある。単に「近位動脈の慣性がない」モデルではない。現行AoVの代数的な抵抗＋二次損失則では、正方向流と負のraw LV–Ao圧差が同時に成立しない。

原データ・同時計測図: [2 ms](./final-2ms/result.json)、[1 ms](./final-1ms/result.json)、[図](./final-1ms/waveforms.svg)。これらは同時計測段階のsource hashesを保持しており、後から追加した連成研究コードの実行結果ではない。

## 2. 実装した研究構成

既存モデルの状態・Ca・心筋・血管・Ao→SAのLは維持し、LV→Aoに固定流路慣性を持つ研究用の弁則を追加した。

正のforward EOAがある区間では、

\[
Q\ge0,\quad r=L(Q-Q_n)/h+RQ+B(A)Q^2-\Delta P\ge0,\quad Qr=0
\]

をbackward Eulerで解く。圧差が負になってもQが正の間はforward EOAを使用する。zero-area/zero-Qの閉鎖支持は別の制約として扱い、非ゼロの受理済みQをzero-areaで勝手に消さない。弁尖の接触力学・逆流・可変流路Lは今回の研究範囲外。

Lは血液密度1060 kg/m³、等価長1.5 cm、物理的流路面積4 cm²から、L=0.0002981494764 mmHg·s²/mLとした。**これは概算用の明示的な工学的仮定であり、正常解剖の確定値でも、PV形状に合わせたfitting値でもない。物理的流路面積とEOAは同一視しない。**

新しいQの状態は研究wrapperが所有し、全体のステップが成功したときだけ圧・容積と同時に進める。候補評価・反復中には更新しない。外側のpromotionが失敗したときも、元のwrapper全体を保持する。Standard70 checkpointとして書き出すAPIや登録は追加していない。

固定Lの計算では、物理的損失、運動エネルギー変化、BEの数値散逸を別々に記録した。

\[
h\Delta P_{n+1}Q_{n+1}
=\Delta(\tfrac12LQ^2)+h(RQ^2+BQ^3)+\tfrac12L(Q-Q_n)^2
\]

閉鎖支持の仕事はQ=0のためゼロとなる。単なる圧力の後処理ではなく、圧・流量・容積を同時に解く構成比較である。

## 3. 連成実験と結果

同じ未変更のsourceを1周期進め、AoV Q=0を実際の最終受理ステップで確認して共通の初期状態にした。各時間刻みで、現行経路、研究経路L=0、研究経路L>0を各3周期実行した。**これは短時間の構成比較であり、新しい周期定常解の認証ではない。**

2つの完成拍のうち前の拍を測定対象にし、続く実周期で次のMV閉鎖まで観察した。E/A・IRT等のために周期境界をコピーしていない。形態指標には同じ駆出が含まれる中央の実行周期を使った。

| 指標 | 現行 2 ms | 固定L 2 ms | 現行 1 ms | 固定L 1 ms |
|---|---:|---:|---:|---:|
| ET | 244 ms | 248 ms | 242 ms | 246 ms |
| AV流量ピーク | 432.0 mL/s | 462.8 mL/s | 434.9 mL/s | 467.7 mL/s |
| 流量ピーク時刻（AVOから） | 32 ms | 30 ms | 30 ms | 28 ms |
| raw LV–Ao平均勾配※ | 3.939 mmHg | 4.003 mmHg | 4.005 mmHg | 4.060 mmHg |
| raw LV–Ao最大勾配 | 6.877 mmHg | 12.283 mmHg | 6.946 mmHg | 12.961 mmHg |
| 正方向流中の最小LV–Ao圧差 | +0.024 mmHg | −1.581 mmHg | +0.021 mmHg | −1.705 mmHg |
| 正方向流かつ負の圧差の時間 | 0 ms | 10.56 ms | 0 ms | 11.54 ms |
| ICT | 63.14 ms | 63.14 ms | 65.14 ms | 65.14 ms |
| IRT | 88 ms | 84 ms | 89 ms | 84 ms |
| Tei | 0.6194 | 0.5933 | 0.6370 | 0.6063 |
| LV +dP/dt | 2586.9 mmHg/s | 2585.6 mmHg/s | 2654.2 mmHg/s | 2652.3 mmHg/s |
| LV −dP/dt | −1306.4 mmHg/s | −1300.7 mmHg/s | −1321.6 mmHg/s | −1315.0 mmHg/s |
| E/A（native flow） | 0.8205 | 0.8212 | 0.8192 | 0.8205 |
| LV容積極値からのSV | 74.189 mL | 74.239 mL | 74.287 mL | 74.360 mL |
| Ao脈圧 | 24.083 mmHg | 24.266 mmHg | 24.225 mmHg | 24.416 mmHg |
| late roof midpoint−chord | −0.1016 mmHg | −0.0785 mmHg | −0.1410 mmHg | −0.1204 mmHg |

※既存のcompleted-beat集計。新しいaudit.gradientはzero-flow境界を除いた、厳密に正の流量が観測された点どうしだけを積分するため、平均値は上表と少し異なる。負の圧差が流れている最中にあるかの判定では、zero-Q境界の圧を混ぜない。

### 読み取り

- 流量ピークは7–8%高くなり、遅くならなかった。ETの延長は約4 msにとどまる。初期の流量立ち上がりは遅くなるが、その後の追い上げが強くなっている。
- 負の圧差下でも正方向流が継続するという、慣性を含む式の表現力は確認できた。ただし、このことだけで全体が臨床的に正しいとは判断できない。
- 評価した中央周期の有意なLVPピーク数は両者とも1。大きな二峰性再発はその周期では検出されなかったが、L追加で早期の肩が現れ、LVP total-variation ratioは1 msで1.404→1.521へ増えた。「すべての周期で振動がなく、広い条件でrobust」とは主張しない。
- late roofの凹みは小さくなるが残る。変化は約0.02 mmHgで、2 ms／1 msの計算間に見られた約0.04 mmHgの差より小さい。両者は各時間刻みの別のsource checkpointからの短期計算であり、この差を純粋な刻み誤差とは同一視しない。微小な曲率の改善を確認できたとは言わない。
- opening/closureを結ぶ全体のchordでは膨らみが増える一方、中央10–90%のchordでは逆に減る。単一の「ふっくら指標」の最適化は参照点を動かして見かけだけ改善する危険がある。
- raw LV–Ao peakは増える。1 msのBernoulli成分ピークは6.296→7.315 mmHgであり、raw peak 12.961 mmHgと同じものではない。将来Lを採用するときは、raw node差・損失・推定jet指標を区別する必要がある。

### 初期抑制のあとで流量ピークが増えた理由

1 msの同じAVO後時刻を比較すると、+11 msではQが329.94→271.52 mL/sへ低下する一方、LV容積は138.638→139.532 mL、LVPは83.127→89.173 mmHg、AoPは77.293→76.212 mmHgとなった。流出の初期抑制とともにLV内に血液が残り、Ao側への充満が遅れ、raw差が5.835→12.961 mmHgへ増えている。

+28 msではEOAは3.452475→3.452663 cm²（約0.005%差）とほぼ同じだが、raw差は6.942→8.135 mmHg、Qは434.31→467.68 mL/sである。**今回の観測に基づく推論では、弁口が大きくなったことより、連成した圧・容積軌道の変化が追い上げを支えている。** 個々の心筋・幾何学的寄与を独立に同定したわけではない。固定された圧を入力する単独弁試験と、能動的な心室を含む閉ループでは、L追加に対するQpeakの応答が同じとは限らない。

## 4. 妥当性・再現性

現行経路と研究経路L=0のnative traceは2 ms、1 msとも完全一致した。連成各群の3周期はすべて完走し、Ca単一所有、心房/心室イベント数、全血液量保存、coronary ledger、デバイスall-offの既存検査を通過した。

固定L群の全観測周期で、最大運動量残差は約5×10⁻¹⁴ mmHg以下、最大BEエネルギー収支残差は約2.1×10⁻¹⁴ mmHg·mL以下。損失powerは非負。これは離散式の整合性を示し、連続時間精度や生理的正しさを保証するものではない。

最終データ: [2 ms summary](./verified-coupled-2ms/summary.json)、[1 ms summary](./verified-coupled-1ms/summary.json)。各directoryのprotocolにsource/request/checkpoint、実行コードSHA、設定、arm定義を保存した。各arm JSONには全受理trace・弁則readback・拍指標がある。production checkpointは出力していない。

比較図: [1 ms SVG](./verified-coupled-1ms/comparison.svg)、[PNG](./verified-coupled-1ms/comparison.png)。PNGを実際に視覚確認した。先行の`coupled-*`、`replay-*`は途中段階の記録としてそのまま残し、最終コードによる出力と混同しない。

最終コード確認:

- 弁の研究則・外側の状態更新/rollback・同時計測・prescribed-flow診断・suite登録: 49 tests passed。
- 研究用cycle実行とcanonicalの時計・イベント・trace同等性: 1 test passed（同ファイルの他の5件はこの選択実行では未実行）。
- 既存のquasi-steady valve、non-coronary circulation、integrated transaction、typed authority sessionの回帰: 82 tests passed。
- `npm run typecheck`、`git diff --check`成功。
- 最終2 ms／1 msのprotocolにある各7つの実装source SHAは、最終worktreeのファイルと一致。新規テストの差分は実行した数値則を変更していない。
- レビューは数表と測定範囲を独立に照合した。これは実装・記録の確認であり、独立した臨床的検証ではない。

## 5. 文献との関係と次の順序

正常LV機能・弁異常のない6例での同時カテーテル計測は、駆出早期の**心室内**圧勾配に局所加速度が重要であることを示す。しかし、それはこの0DモデルのLV–Ao port差そのものの正常範囲でも、PV上辺の曲率基準でもない。[Pasipoularides et al., 1987](https://pubmed.ncbi.nlm.nih.gov/3621488/)

数理的にも、MV流がない駆出中はdV/dt=−QなのでdP/dV=−(dP/dt)/Qとなる。P(t)が単峰であっても、P(V)がどの部分でも上に凸になるとは限らない。小さいQでこの比を直接計算して曲率gateにすることは避けた。

次はL係数を見た目に合わせて探索するのではなく、既存同時計測から、**心筋応力→形状変化→LV圧への変換と、動脈側の血液貯留・流出**の寄与を切り分ける。Ca/Landは直ちに変更しない。新しい構成比較を行うなら、その仮説と圧の測定位置・流路の意味を先に定義し、少数条件で評価する。

候補が実際に有望な場合に限り、HR60/70、時間刻み、波形・ET・各指標・必要なpreload応答を確認してから採否を判断する。今回の短時間probeはbaseline資格試験に代えず、取り下げた後負荷qualification batteryも再導入していない。
