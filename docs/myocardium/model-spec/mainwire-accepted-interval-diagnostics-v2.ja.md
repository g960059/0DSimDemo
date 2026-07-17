# Main-wire accepted-interval diagnostics V2

## 目的

この milestone は、periodic runner V3 が保持する accepted interval を、
cycle physiology、periodic summary、視覚 review まで一貫して配線する。
exact-event Ca により nominal grid が分割される場合も、sample count や nominal
`dt` を物理時間の代用にしない。

変更対象は readback と表示だけである。循環、弁、TriSeg、Land、parallel SLS、
pericardium、Ca state、Newton solver、periodicity classifier、固定 parameter は
変更しない。parameter fitting、形状 fitting、正常範囲 gate、smoothing、
resampling、signal interpolation も追加しない。

公開 ID は次である。

- selected context:
  `main-wire-normal-adult-five-wall-selected-cycle-context-v2`
- cycle diagnostics:
  `main-wire-normal-adult-five-wall-cycle-diagnostics-v2`
- periodic summary:
  `main-wire-normal-adult-five-wall-periodic-summary-v2`
- periodic review:
  `main-wire-normal-adult-five-wall-periodic-review-v2`

V1 consumer は legacy fixed-sample contract として残す。V2 は V1 の canonical
関数を内部で呼び出して nominal `dt` を再導入しない。

## 共通 selected-cycle context

最終 retained complete beat を一度だけ選択し、Summary V2 と Review V2 が同じ
context resolver を共有する。context は次を保持する。

- beat start / end / duration
- nominal grid count
- accepted interval count
- minimum / maximum accepted duration
- accepted endpoint samples
- accepted calcium trial からコピー済みの exact event
- real predecessor の availability

beat 1 は cold accepted state から始まり、その state は Diagnostic V3 sample を
持たない。このため context は次の discriminated union とする。

1. `complete`
   - real predecessor がある
   - 差分、仕事、phase、PV morphology を計測できる
2. `missing-preceding-diagnostic`
   - `reason: cold-start`
   - accepted endpoints は保持する
   - predecessor を state 座標から捏造しない

## accepted physical time

各 accepted interval を

$$
I_n=(t_n,t_{n+1}],
\qquad
\Delta t_n=t_{n+1}-t_n>0
$$

とする。flow integral と time-weighted mean は backward-Euler endpoint ownership
に従う。

$$
\int Q\,dt
\approx
\sum_n Q_{n+1}\Delta t_n,
$$

$$
\bar P
=
\frac{\sum_n P_{n+1}\Delta t_n}
{\sum_n\Delta t_n}.
$$

nominal `stepsPerBeat` は protocol / display metadata であり、積分重みではない。
Review の横軸も sample の nominal phase を使わず、

$$
x_{n+1}
=
\frac{t_{n+1}-t_{start}}{T_{accepted}}
$$

から直接計算する。

## exact calcium event と phase ownership

LA onset は accepted calcium trial event のうち `strengthByWall.LA > 0` のものを
使う。schedule を再照会せず、fixed prior から onset phase を再推定しない。

- 1 event: measurable
- 0 event: `no-left-atrial-calcium-onset-event`
- 2 event 以上: `multiple-left-atrial-calcium-onset-events`

event が accepted interval 内部にある analytic control では、診断上の duration
だけを exact event time で分ける。同じ accepted endpoint signal を両側で用い、
中間 state は補間しない。

$$
\Delta t_{conduit}
=t_{Ca}-t_n,
\qquad
\Delta t_{pumping}
=t_{n+1}-t_{Ca}.
$$

work increment、$P\Delta V$、$\sigma\Delta\varepsilon$、SLS energy increment は
accepted endpoint transition が所有する離散量なので、内部 event で分割せず、
`dt` を再乗算しない。

Review の event marker は exact time と owner accepted endpoint を別々に持つ。
壁 strength は LA、LVFW、SEP、RVFW、RA の全5壁を保存し、partial input で省略された
壁は strength 0 とする。表示 label は nonzero wall 群を示すため、ventricular
trigger を no-op と誤認しない。

## valve event と周期境界

valve transition は実在する次の accepted boundary だけから検出する。

- real predecessor $\rightarrow$ endpoint 0
- endpoint $n-1\rightarrow n$

last endpoint $\rightarrow$ endpoint 0 の人工 transition は作らない。closed run の
長さは sample count ではなく accepted duration で順位付けする。window の先頭と
末尾が同じ closed phase の一部なら duration は連結できるが、これは人工 event の
追加を意味しない。

LA onset 後の MVC candidate も index 差ではなく、onset からの cyclic-forward
physical duration で選ぶ。これにより onset が cycle 末尾近くにあっても、real
predecessor から endpoint 0 への closure を正しく選べる。

## phase、flow、volume、pressure

phase は次の半開区間を基本とする。

- reservoir: MVC から MVO
- conduit: MVO から exact LA Ca onset
- pumping: exact LA Ca onset から MVC

phase duration の総和は accepted cycle duration と一致しなければならない。
PV S/D/Ar と MV E/A の volume / VTI は各 accepted duration で積分する。MV の
physical EOA が非正または非有限な正流量 interval では、sample count に加えて
影響 duration を返し、VTI を `null` とする。

全周期 LA volume extrema と PV path は real predecessor と全 accepted endpoints を
使う。a/x/v/y pressure extrema は phase ownership を持つ accepted endpoints のみで
定義し、波形を平滑化しない。

## IVRT-like window と relaxation tau

IVRT-like window は

$$
(t_{AoVC},t_{MVO}]
$$

である。AoVC endpoint 自身を除き、MVO endpoint を含む。周期境界をまたぐ場合は
accepted timestamp を cyclic に unwrap する。

tau は同 window の accepted endpoint LV transmural pressure を使う report-only の
duration-weighted log-linear fit である。各 point の重みは対応 interval duration と
する。これは physiology acceptance gate でも、漸近圧の症例 fit でもない。

## work と SLS ledger

最初の accepted interval も real predecessor との差分から計測し、捨てない。
stress work coverage は

$$
coverage
=
\frac{\text{paired accepted duration}}
{T_{accepted}}
$$

とする。complete window では 1 である。正符号は既存 diagnostic convention に従い
work on wall を表す。Land active stress に thermodynamic stored-energy claim は
追加しない。

## Summary V2 availability

`complete` summary は accepted-duration flow ledgers、hemodynamics、Cycle V2、work、
LA PV morphology を返す。raw range は predecessor と endpoints を使う。

`missing-preceding-diagnostic` summary は次を `null` にする。

- flow ledgers
- hemodynamics
- cycle physiology
- work / SLS ledger
- LA PV morphology

一方、endpoint-only の chamber volume、pressure、flow、residual range は残す。
情報欠損を「曲線更新失敗」と同一視せず、利用できる raw readback と利用できない
差分診断を分離する。

## Review V2 visual contract

Review V2 は6 panelだけを持つ。

1. group-wise beat closure
2. LA blood-volume PV
3. LV blood-volume PV
4. left-heart pressures
5. 4 valve flows と aggregate PVein-to-LA flow
6. accepted interval duration と exact Ca event

closure panel は `calcium-event-state` を含む全8 group を表示する。pressure panel の
LA/LV は transmural pressure、Ao は absolute node pressure であり、reference zero が
異なることを title と claim boundary に明記する。

complete PV / waveform path は

```text
real predecessor -> endpoint 0 -> ... -> endpoint N-1
```

だけを描く。point は $N+1$、実 segment は $N$ である。last endpoint から first
endpoint へ閉じる segment は追加しない。phase 色もこの時系列 segment ownership に
従い、周期端で離れた run を人工的に結合しない。

cold-start では endpoints だけを描くため、point は $N$、描画できる実 segment は
$N-1$ である。最初の accepted interval segment が欠けることを
`missingFirstIntervalSegment` で明示し、phase path は `null` とする。

## 検証 matrix

必須 regression は次である。

- nonuniform accepted durations の flow integral、delay、phase duration
- internal LA onset の exact time と first accepted endpoint の分離
- LA onset 0件 / 複数件の明示的 not-measurable
- invalid EOA の interval count と affected duration
- predecessor を含む whole-cycle extrema
- late onset 後に real predecessor-to-endpoint-0 MVC を選べること
- cyclic `(AoVC,MVO]` window と duration-weighted tau
- complete stress-work coverage = 1、最初のSLS intervalを含むこと
- exact-event state: nominal 50、accepted 52、event 2件
- analytic control: nominal 50、accepted 50、shadow event 2件
- beat 1: raw endpoint rangeは残し、difference-based outputは不可
- PV path: complete $N$ segment、cold $N-1$ segment、人工 closureなし
- waveform x が accepted timestamp から直接得られること
- 全5壁 Ca marker と ventricular event の可視識別
- `calcium-event-state` closure group の表示
- summary / review 前後で retained dynamics stable hash が不変

## claim boundary

この V2 から主張できるのは、accepted physical time と event / boundary ownership に
整合した診断・表示である。次は主張しない。

- PV loop、E/A、x/y、tau、work の正常ヒト範囲への適合
- v-loop や a-loop の形状改善
- parameter の同定、症例 fitting、正常性 gate
- 新しい心筋、受動壁、弁、血管、pericardium model
- dt-halving robustness
- current ModelCore / browser runtime への採用

したがって Review V2 は、今後の大胆な数理モデル比較を同じ物理時間・同じ境界で
観察するための計測器であり、特定の形状を作る補正器ではない。

## tracked smoke artifact provenance

tracked artifact は `dt=0.02 s`、`maximumBeatCount=2`、canonical initialization、
`exact-event-state` で生成した。nominal grid 50 に対して accepted interval 52、
exact accepted event 2、real predecessor ありを確認するための timebase / renderer
smoke artifact である。2 beats で `maximum-beats-reached` のため morphology は
provisional / nonconverged であり、normal morphology acceptance artifact ではない。

生成 command は次である。

```bash
npx vite-node --script tools/myocardium/runMainWireNormalAdultFiveWallPeriodicSteadyV1.ts \
  --dt 0.02 --max-beats 2 --init canonical \
  --calcium-representation exact-event-state \
  --output /tmp/mainwire-five-wall-exact52-v3.json

npx vite-node --script tools/myocardium/renderMainWireNormalAdultFiveWallPeriodicReviewV2.ts \
  --input /tmp/mainwire-five-wall-exact52-v3.json \
  --output data/myocardium/visuals/mainwire-normal-adult-five-wall-accepted-interval-exact52-review-v2.html \
  --svg-output data/myocardium/visuals/mainwire-normal-adult-five-wall-accepted-interval-exact52-review-v2.svg
```

tracked output は次である。

- `data/myocardium/visuals/mainwire-normal-adult-five-wall-accepted-interval-exact52-review-v2.html`
- `data/myocardium/visuals/mainwire-normal-adult-five-wall-accepted-interval-exact52-review-v2.svg`
