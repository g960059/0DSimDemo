# Ca・長さ・張力回復の分離比較 — 2026-09-06

## 結論

**新しいbaselineは採用しない。今回の12条件はすべて不採用。**
公開Standard70の数式・baseline・knob基準・Model Surface・mint gateは変更していない。
研究用の比較条件と測定・検証を追加した。後負荷試験は行っていない。

単純なTref不足でも、Ao–SAのLだけの問題でもない。今回の限定された範囲では、
Ca入力、長さ依存、架橋の入れ替わり、短縮後の張力回復を独立に見る必要がある。
これは既存Land系で正常baselineが「不可能」という証明ではないが、同じ係数探索を
さらに広げるより、張力状態の結び付け方を検討する根拠になった。

[全測定表](MEASUREMENTS.md) / [波形・内部状態の比較図](comparison.png) /
[集計JSON](analysis.json) / [1ms比較](refinement.json)

## 何を実装したか

- 研究用fixtureに、既存2状態Caの立ち上がり/減衰時定数比の比較を追加。
  実際のaccepted event設定・周期初期状態まで結び直す。表示用Caだけの変更ではない。
  Caの最小・最大、心房Ca、電気的delayは維持。新しいCa状態は追加していない。
- 追加Land stretch倍率を1にする比較を追加。幾何学的stretchまで1に固定するのではない。
  既存anatomyではloaded referenceのstretch1.1が残る。構成則との物理的結合が変わるので
  無害な座標の付け替えとは扱わない。
- 既存Landのkws/phiを一つのprimitive ownerから変更し、派生rateとconstruction identityを
  更新する研究条件を追加。通常のbaseline/preset fitの自由度や許容範囲は増やしていない。
- 軽量component runnerにRT95、状態を保った短縮後の固定長試験、Ca/歪み記憶の診断用
  介入を追加。Caを瞬時にfloorへ戻す、歪みを瞬時にゼロにする操作は原因分離用のみで、
  心臓モデルへの実装案ではない。採用する数式に状態の投影や波形平滑化を入れていない。
- 原著§3.5と図6をPDFスキルで確認し、旧component priorの出典表記を訂正した。
  原著の最終モデルTTP175、RT50 121、**RT95 281ms**であり、RT90ではない。
  この訂正はmetadataのみ。Ca入力値や公開runtime数式は変えていない。

## 新しくわかったこと

### 1. Caを速くすればET/IRTが同時に良くなるわけではない

source Land、Tref120kPa、stretch追加倍率1.06を固定し、Caのrise/decay比1→0.3を比較した。

| 指標 | 元のrise比1 | rise比0.3 |
| --- | ---: | ---: |
| ET | 188ms | 152ms |
| IRT | 184ms | 138ms |
| AV mean gradient | 8.38 | 10.00mmHg |
| CI | 2.974 | 2.657L/min/m² |

Caの尾を減らすと弛緩は速まったが、駆出がさらに短くなった。
stretch倍率を1にしても、この方向は逆転しなかった。
元のalpha入力はLand図6のdigitization fitに由来する。新しいrise比はそのデータの
再fitではなく、意図的に外したcounterfactualであり、ヒト正常Caとは主張しない。

### 2. 等尺性twitchだけでは短縮への応答を決められない

phiを変更しても、固定長・初期歪みゼロのisometric stress時系列は完全一致した。
全サンプル比較で確認済み。一方、閉ループのETとPV上辺は大きく変わった。

source Landと同じCa x1.1、Tref120kPaのままphiを0.4倍にすると、
ET194→244ms、mean gradient7.93→4.11mmHgになったが、IRT194→182msに留まり、
AoPも125/81→104/72mmHgへ低下した。Tref160kPaでもIRT190msだった。
圧の中央部は平坦化し、駆出中央半分の圧変動/全拍圧振幅は約2.14%となった。
この2.14%は形の記述量であり、文献で確立された正常境界ではない。

したがって、Ca trace・isometric twitch・baseline EFだけで力学応答を同定したとは
言えない。fittingでは有限速度短縮や短縮停止後の応答も、少数のcomponent assayとして
使う方が有用である。

### 3. 架橋を外す速さと、短縮後の張力回復は競合し得る

選択済みの遅いkwsではksu=7.2/s、原著whole-organ設定では18/s。
同じ既存式でcs=phi×ksuの関係にある。kwsだけを遅くすると両方が遅くなる。

固定長、Wからの新規流入を無視、−1<ζS<0、追加exitなしという限定条件では、
strong forceの時間変化は

    d[S(1+ζS)]/dt = S[-ksu(1+ζS) − cs ζS]

となり、ζS < −1/(1+phi)ではSが減っていても張力が増え得る。
これは短縮後に力が戻ること自体を異常と断定する式ではない。
また、駆出中の長さ変化、弱い架橋、新規流入、幾何学、受動張力を省いているため、
LVP二峰性の十分条件でもない。component試験の説明に限る。

Caをfloorへ戻しても、遅いkws・追加exitなしでは長い張力の尾が残った。
歪み状態だけをゼロにすると張力は跳ね上がった。どちらも単純な削除では解決しない。

### 4. 2つのrateを分けても、現時点の候補は採用できない

cs=16.056/sを保ってkwsを24/36/sへ増加、Tref160/200kPaの4条件を追加。
IRTは約130–146msまで短くなったが、peak gradientは約20–30mmHg、
CIや充満圧も不十分。kws36/sではLVP/RVPの二峰性が出た。
Trefを増やすと必要なoutputすべてが良くなる、という結果ではなかった。

Land原著自身も、cycling ratesとの関連からdistortion rateだけを動かす生理的妥当性に
慎重である。この反証材料は維持する。元の広い探索範囲内というだけでは正常性を
保証できない。速いkwsではisometric RT95も原著最終fitより短くなるため、臓器outputが
良くなっても、それだけで採用することはできない。

### 5. 時間刻みを半分にしても形状の問題は消えない。ただし数値収束済みではない

| 研究条件 | dt | LV/RV peak数 | LVP再上昇 | ET | IRT | AV peak gradient |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| kws36・Tref160kPa | 2ms | 2/2 | 1.67mmHg | 244ms | 130ms | 24.97mmHg |
| 同一construction | 1ms | 2/2 | 1.73mmHg | 241ms | 133ms | 27.22mmHg |
| phi0.4・Tref160kPa | 2ms | 1/1 | 0 | 238ms | 190ms | 15.28mmHg |
| 同一construction | 1ms | 1/1 | 0 | 236ms | 190ms | 15.81mmHg |

両条件ともAo–SAのL=0。平坦例の中央圧変動比は2.14→2.17%だった。
二峰性は1msでも残るため、2msだけの描画の見かけとは扱えない。
一方、悪化例のpeak gradientは約9%変わり、ICT29.14→37.14ms、Tei0.652→0.706と
変化した。定量的な数値収束は未確認であり、baseline数値品質の合格とは主張しない。
1.7mmHg程度の2峰を即「病的振動」とするのも過剰。この例は他の大きな不適合もあり不採用。

最大勾配の近傍では弁の有効面積が約2.75cm²、開度約79%、流量約706mL/sだった。
駆出時間だけでなく早期の流量と開口の時間関係も次の監査対象になる。

**測定定義:** 表のAV勾配はaccepted beatの順行流中LV−Ao node差。
Doppler簡易Bernoulli勾配、pressure-recovered catheter差、表示AoPと無条件に同一視しない。
ICT/IRT/Teiも弁イベント定義。component RT50/RT95や臨床Doppler値への同一視はしない。

## 次の方針

1. この係数の探索拡大はここで止める。12条件のどれも予備能評価やmintへ進めない。
   無関係な循環parameterで形の問題を隠したり、合格のためにgateを変えたりしない。
2. **次の構造比較は、架橋populationとその平均歪みの結び付け方に絞る。**
   現行の定常rate近似と、実際の架橋流入・流出を使った歪みmoment収支をcomponentで比較する。
   後者は独自の検討候補であり、原著の推奨モデル・確立したヒト正常モデルとは主張しない。
   入ってくる架橋の歪みと、外れる架橋が持ち出す歪みを明示し、状態数を増やさず表現できるか
   を調べる。zero populationの扱い、力・仕事の整合性、dt収束を先に確認する。
3. Caは現行のsource-fit traceを対照として残す。任意のLVP時刻やAV開閉をCaへ入力して
   圧波形を作ることはしない。新Ca familyは必要性が示された場合に限り、測定の来歴と
   component tension/length条件を合わせて検討する。
4. componentで妥当性と改善がある場合だけ閉ループへ入れる。同時に駆出早期のflow/開口と
   peak勾配の数値品質を確認。旧UI/analysisを再実装したり、新しいSurfaceを作ったりしない。
5. baseline fittingは、以上が整理されてから再開。生理的なreferenceと実際の近傍応答の
   広さを先に確かめ、その後でTBV・抵抗などを調整する。knob=1への付け替えは最後。

## 実行・検証記録

- 最新component-v4: 1004ケース（dt・stretch違いと診断介入を含む。1004の独立した実験データ
  ではない）。等尺性960、既存軌道replay16、短縮後の診断28。計算は数秒。
- cold閉ループ: 12条件すべて定常化。4 workerの各batch wall timeは約91/64/79秒。
- 1ms: 不採用2条件をcold再実行、2workerで約135秒。
- period1は従来の連続3周期条件。軽量実行後、完全なterminal metricsと材料readbackを保存。
- 最新componentのsource hash、過去batchが保持するsource snapshot hash、1ms/2msの
  construction一致、phi変更時のisometric全点一致をスクリプトで検証。
- 対象テスト: research fixture36、fast-weak component8、Ca drive15、suite manifest6が成功。
  TypeScriptとgit diff --checkも成功。全repository test/UI/browser testは今回未実行。
- 研究出力はこのlocal artifacts以下。GitHubへのpush/PR更新はまだ行っていない。

原著: Land et al. 2017, DOI [10.1016/j.yjmcc.2017.03.008](https://doi.org/10.1016/j.yjmcc.2017.03.008)。
[閲覧PDF](../diastolic-activation-2026-09-05/land2017-author-manuscript.pdf)。
原著はCaと張力を異なる実験由来で組み合わせており、whole-organの充満/負荷設定も
この閉ループと異なる。今回の図の視覚確認と書誌metadata訂正には
[PDFスキル](/Users/hirakawa/.codex/plugins/cache/openai-primary-runtime/pdf/26.904.11930/skills/pdf/SKILL.md)を使用した。
