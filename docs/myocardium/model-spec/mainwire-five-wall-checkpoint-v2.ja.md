# Main-wire five-wall checkpoint V2

## 目的と境界

本仕様は、main-wire由来non-coronary circulation、one-joint five-wall mechanics、
five-wall event calciumの**受理済み状態を原子的に保存・復元する**境界を定める。
周期定常runnerのwarm-start、artifact、accepted-interval積分は本変更に含めない。
旧checkpoint V1からのmigration/aliasも設けず、未知schemaとschema 1はfail closedとする。

## 時刻とrevisionの所有

三つのdynamic ownerについて常に

$$
r_{circ}=r_{mech}=r_{Ca}=r_{tx},
\qquad
t_{circ}=t_{mech}=t_{Ca}=t_{tx}
$$

を要求する。`revision` は受理されたcoupled subintervalの個数であり、nominal grid
step数ではない。したがってHR 60、nominal `dt=20 ms` の一拍はgrid数50であっても、
0.012 sと0.852 sのoff-grid Ca eventで区間が分割され、受理revisionは52となる。

## Ca scheduleの時間意味論

schedule providerは再hash可能なserializable snapshotを所有し、opaque callbackは持たない。
event集合の区間規約は全て

$$
(t_{start},t_{end}]
$$

である。

- `fixed-periodic`: period、phase origin、上記区間規約をhashに含める。整数周期移動のみ不変。
  fixed-sinus V1 factoryのphase originは0に固定し、別originを名乗るforged providerは拒否する。
- `absolute-explicit`: event時刻は絶対時刻であり、exact-time resumeは可能だが時刻移動は禁止。

Ca checkpoint V2はrepresentation、initialization、schedule id/hash/snapshot/time semantics、
全Ca parameterのfull snapshotとidentity hash、revision、accepted time、5壁×2状態を保存する。
event列挙もopaque callbackではなく、このhash-owned schedule snapshotから純関数的に導出する。

## checkpoint構造

outer schema V2は次を含む。

1. circulation checkpoint V2
   - topology full snapshotと再計算可能hash
   - node volume、dynamic edge flow、valve opening memory、TBV、revision/time
2. existing whole-heart mechanics checkpoint
   - provider/parameter/state schema identity
   - chamber volumeとmaterial state
3. Ca checkpoint V2
   - 5壁×2状態を含む全identity
4. stateless protocol binding
   - circulation runtime full snapshot/hash
   - common-pericardium binding full snapshot/hash

pericardiumはdynamic stateを追加しない。safe resumeに必要なprotocol identityとしてのみ保存し、
exact restoreでは同一bindingを要求する。実TBVはcirculation stateが所有し、TBV prior provenanceは
将来のperiodic warm-start envelopeが所有する。

全state/envelope fingerprintはfinite JSON numberを丸めず、
`JSON.stringify(number)`相当のcanonical表現から計算する。これは改ざん検出checksumであり
暗号署名ではない。protocol component hashと異なり、`1e-12`丸めを行わない。

mechanicsについてはexisting provider contractの`parameterIdentityHash`を尊重する。現在のcanonical
providerは一部の構成hashで`1e-12`丸めを用い、checkpoint自体はfull provider physics snapshotを
所有しない。このためV2のclaimは**material stateのexact integrityとprovider-defined identity**であり、
collision-freeなmechanics provenanceではない。full serializable provider snapshotは将来のcontract V2
で扱い、本変更でgeneric mechanics contractを膨張させない。

## restore policy

通常APIは同一time/revisionへのexact restoreだけを許可する。任意rebase optionは存在しない。

別名のcycle-boundary helperだけが、以下を全て満たす場合にrevisionを0へresetできる。

- canonical normal-adult factoryが発行したautonomous five-wall Land/TriSeg provider
- source/targetともschedule phase origin上
- source-target差が整数period
- fixed-periodic schedule
- respiratory amplitudeとrateが全て0
- circulation runtime、Ca、mechanics、pericardiumのprotocol identityが完全一致

absolute explicit schedule、非整数周期、非boundary、time-varying respirationは拒否する。
将来pericardium-only continuationを許す場合も、periodic warm-start側の専用APIでfull structural
comparison後に扱い、このgeneric checkpoint restoreを緩めない。

## claim boundary

- checkpointは数理モデルのparameterを増やさず、parameter fittingを行わない。
- checkpoint成功はperiod-1収束、症例妥当性、ModelCore runtime採用を意味しない。
- event Caは引き続きprescribed two-state kernelであり、SR/RyR/SERCA、restitution、
  refractoriness、alternans機序を所有しない。
- off-grid integrationの時間重み付き診断は別milestoneで実装する。
