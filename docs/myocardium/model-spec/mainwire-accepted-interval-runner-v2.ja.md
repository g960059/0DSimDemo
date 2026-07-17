# Main-wire accepted-interval periodic runner V2

## 目的

この milestone は、periodic runner が実際に commit した transaction を
`AcceptedIntervalTimebaseV1` へ配線する。exact-event Ca によって nominal grid
が分割されても、診断の時刻・duration・event 所有権を sample index や nominal
`dt` から再構成しない。

変更は accepted readback の schema と provenance に限定する。循環、弁、
TriSeg、Land、SLS、Ca kernel、Newton solver、固定 parameter、periodicity 判定は
変更しない。形状 fitting、parameter fitting、生理 gate も追加しない。

## 公開 schema

受理区間を持つ結果は、既存 V2 の構造を黙って変更せず、次の明示的な公開
schema とする。

- experiment id:
  `main-wire-normal-adult-five-wall-periodic-steady-v3`
- result `schemaVersion`: `3`
- canonical runner: `runMainWireNormalAdultFiveWallPeriodicSteadyV3`
- V1 / V2 の runner・result type 名は V3 を指す deprecated transitional alias

protocol identity は dynamics と fixed protocol を表す既存 V2 のままである。
result schema の更新は、protocol や生理 parameter の更新を意味しない。
transitional alias は source import の移行猶予にすぎず、旧 V1 / V2 JSON wire schema
を凍結して返す互換 API ではない。caller は返却された experiment id と
`schemaVersion` を必ず確認する。

## transaction から受理区間への写像

成功した coupled transaction (n) ごとに

$$
I_n=(t_n,t_{n+1}]
$$

を一つだけ作る。各 `AcceptedIntervalV1` は次を所有する。

- transaction 開始前の accepted time (t_n)
- commit 後の accepted time (t_{n+1})
- 実 duration (\Delta t_n=t_{n+1}-t_n)
- commit 後の `MainWireNormalAdultFiveWallDiagnosticSampleV3`
- `stepped.calciumTrial.events` から直接コピーした ((t_n,t_{n+1}]) の event

runner は retained trace を作るために scheduler を再照会しない。event の時刻や
壁別 strength を再推定することもない。accepted calcium trial の
`baseRevision` と trial 内 index、および commit 後 calcium state の schedule id /
identity hash を provenance として保持する。

event identity は

```text
calcium:<scheduleIdentityHash>:r<baseRevision>:i<trialEventIndex>:<eventFingerprint>
```

とする。`eventFingerprint` は絶対時刻と壁別 strength を含む `calciumEvent` の
stable hash である。accepted trial の base revision と trial 内 index を occurrence
identity に含めるため、内容も時刻も同じ正当な coincident event を別 event として
保持できる。同じ ownership record からは deterministic に同じ ID が得られ、同一
ID の二重所有は validator が棄却する。32 bit fingerprint 単独の collision-free 性や、
異なる step partition 間で event ID が同一になることは主張しない。

## revision ledger

各 retained beat は次を明示する。

- `startRevision`
- `endRevision`
- `acceptedIntervalCount`

成功 transaction が revision を一つ進めるため、必須 invariant は

$$
N_{interval}
=N_{endpoint\ sample}
=r_{end}-r_{start}
$$

である。interval の連続性、duration 総和、endpoint timestamp、event の
((start,end]) 所有権も retained beat 作成時に検証し、不整合を黙って補正しない。

## retained window と predecessor union

差分診断には window start の diagnostic sample が必要だが、cold accepted state
自体は Diagnostic V2 sample ではない。したがって偽の sample を state 座標から
合成しない。

retained trace は次の discriminated union とする。

1. `missing-preceding-diagnostic`
   - `reason: cold-start`
   - `precedingSample` を持たない
   - cold start から始まる beat 1 の正しい表現
2. `complete`
   - window start と同時刻の `precedingSample` を持つ
   - beat 2 以降では、直前に受理された interval endpoint を同一 object のまま使う

これにより、beat 1 の情報欠損を明示しつつ、beat 2 では
`validateRetainedAcceptedIntervalWindowV1` が要求する完全 window を得る。

既存 consumer の段階的移行のため `.samples` は残す。ただしこれは
`acceptedIntervalTrace.intervals[*].endpointSample.sample` の compatibility
projection であり、時刻・duration・event の canonical owner ではない。
特に可変 step の exact-event trace を旧 Summary / Review の sample-count timebase
へ渡しても診断的に安全だとは主張しない。

失敗した beat についても、失敗前に commit 済みの endpoint sample と accepted
interval をそれぞれ `retainedPartialBeat` と
`retainedPartialAcceptedIntervals` に保持する。失敗 trial 自体は受理区間にしない。

## exact-event と analytic control

`dt=0.02 s`、HR 60、fixed sinus schedule の一拍では次を期待する。

### exact-event-state

- nominal grid count: 50
- off-grid event (0.012 s, 0.852 s) で事前分割
- accepted interval / endpoint sample / revision increment: 52
- duration ledger: 1 s
- 各 event は一度だけ所有

二拍目では同じ event phase が 1.012 s と 1.852 s に現れ、beat 1 は
missing-predecessor、beat 2 は complete window になる。

### analytic-periodic-control-with-exact-event-shadow

- numerical interval / endpoint sample / revision increment: 50
- numerical grid は 0.012 s と 0.852 s で分割しない
- shadow calcium trial が所有した二 event は、それらを内包する accepted interval
  の event として一度ずつ保持する

すなわち、event readback の保持と、mechanics の numerical step splitting は別の
claim である。

## claim boundary と次段階

この milestone が主張するのは次だけである。

- accepted physical interval の runner 配線
- endpoint Diagnostic V2 の provenance
- accepted calcium trial からの event copy
- open-start / closed-end の一意な event ownership
- retained beat の revision / interval count invariant
- cold-start predecessor を捏造しないこと

legacy `CycleDiagnosticsV1`、`PeriodicSummaryV1`、`PeriodicReviewV1` は固定sample
consumerとして残す。accepted-time semantics を使う downstream consumer は明示的な
Cycle/Summary/Review V2 とし、各積分、delay、regression の owner と window を分離する。

したがって、この変更だけから PV loop、E/A、v-loop、tau、圧・流量の正常性改善を
主張しない。従来 sample trajectory の stable hash を不変 gate とし、readback
配線が dynamics を変えていないことを確認する。
