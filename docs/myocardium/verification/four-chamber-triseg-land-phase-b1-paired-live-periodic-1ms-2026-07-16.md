# Four-chamber TriSeg + Land Phase B1: paired 1 ms live-periodic evidence (2026-07-16)

## 結論

SLS-off / SLS-on の fresh paired closed-loop run は、両 mode とも14周期で period-1 criterion を3周期連続通過し、exit code 0で完走した。SLS-offで8の字トポロジーを保持することは、仕様、解析manifest、実行時exit gateのいずれにも要求していない。

今回の形態結果は、LA/RA、SLS-off/onの全4系列に幾何学的な自己交差と符号が反対の2 lobeを認める一方、小さいlobeが事前宣言した最小面積を大きく下回り、全系列が `indeterminate` となった。したがって、「8の字が明瞭に存在する」とは判定しない。SLS-onは小lobeを約2%増やしただけであり、潰れたv-loopを実質的に回復していない。

LAP/RAPの尖りは、1 msの単一event jumpではなく、複数stepにわたる急なactive upstrokeである。最大1 ms圧変化はSLS-off/onでほぼ同じであり、SLSをownerとは判定できない。形状として尖って見えるという指摘は妥当だが、SLS branchにより作られた数値不連続ではない。

弁flow/Caで定義したreservoir/conduit/pumpの完全な位相窓は、各窓内でvolumeが厳密単調ではなかった。このためcanonical matched-volume artifactは全6相を `ambiguous` とし、pressure ownerの同一容量帰属を発行しない。結果を見た後に極値で切り出した記述解析ではconduitはreservoirより下だが、その差はLA約0.35 mmHg、RA約0.19 mmHgと小さい。これはcanonical判定を上書きしない。

## 実行条件と認証境界

- 実行日: 2026-07-16 (Asia/Tokyo)
- command: `npm run diagnose:four-chamber-triseg-land-b1-paired-live-periodic-be`
- solver/grid: backward Euler, `dt = 0.001 s`, canonical cycle `0.8 s`
- mode order: SLS-off, SLS-on
- maximum cycles: 100
- required consecutive passing cycles: 3
- parent manifest SHA-256: `218d5abd7b53dd0e4db594bac1ac1848d3ac49acc3efbdd02b843ee27338bf24`
- parent numerical evidence SHA-256: `7dd2cc61e9f5da24d9495a89b20369bfea143eb03e511fa312ee0c55a3acc9ec`
- event schedule SHA-256: `341c9f3eee1df13cc4e5615741c9911ac8315191d3ce5fbd90611985b5ea8c50`
- initial source parity audit SHA-256: `eee3744691a49dd4806ef5f4b4a31f86264673a32ab1e4ef53bf0df67caeb6c7`
- initial common-coordinate maximum normalized difference: `2.5002047047089595e-15` (tolerance `1e-6`)
- all eight initial flows exactly equal and zero: `true`
- elapsed wall time: `3787.185396583 s`
- exit code: `0`

| mode | cycles | adjacent terminal-state distance | terminal SLS distance | maximum relative signed net-flow mismatch | retained transactions / energy stages | terminal capsule SHA-256 |
|---|---:|---:|---:|---:|---:|---|
| SLS-off | 14 | `3.38619285495183e-8` | `null` | `2.5894262185556623e-8` | `800 / 800` | `5cfade01c928dfda986c965081dbc60723f00148aa4afd15255e28e2c57d148b` |
| SLS-on | 14 | `3.269009152356987e-8` | `1.898296896541411e-9` | `2.5706973265794126e-8` | `805 / 805` | `ac4abd7bf917f3f594e89f35baf745dda6af5dd4bb3e1a43ea59ed314523763d` |

Final paired evidence SHA-256は `9be84c084a3f89b5993e61c882110a02b4c89cf73b43d94186a63c7710b93661`。同一process内でparent、schedule、initial parity auditのobject identity、retained capsule cross-link、energy summary発行順を確認した。builder-issued authenticationはserialization後には再構成できない。

## 視覚・数値artifact

| artifact | path | canonical content SHA-256 |
|---|---|---|
| paired terminal waveform | [JSON](four-chamber-triseg-land-phase-b1-paired-live-periodic-terminal-waveform-1ms-2026-07-16.json) | `e552c5db349a518eaec9fd25ef11dfd4eb5f50834315cf2ab52bde4f0201646c` |
| atrial PV morphology | [JSON](four-chamber-triseg-land-phase-b1-paired-live-periodic-atrial-pv-morphology-1ms-2026-07-16.json) | `32eeb5546834b6044fa6376c676754ae9dbb77667062fda5e3940e38daad9811` |
| matched-volume pressure attribution | [JSON](four-chamber-triseg-land-phase-b1-paired-live-periodic-atrial-matched-volume-pressure-1ms-2026-07-16.json) | `0ce82ced0b9478a0f4285ac18572b758d217a0747b0b9221460555261c74c61a` |
| visual review | [self-contained HTML](four-chamber-triseg-land-phase-b1-paired-live-periodic-terminal-waveform-1ms-2026-07-16.html) | file SHA-256 `669a5ae39a8f4755101f3477a10cd685c0fe310c362118d4c9f190b1cf7820e7` |
| authenticated stream snapshot | [JSONL](four-chamber-triseg-land-phase-b1-paired-live-periodic-1ms-2026-07-16.jsonl) | file SHA-256 `66feed1d0db8924a9deae24c0337ff0a40a4ac679800740c7e1f5661bef4e6ba` |

HTMLはLA/LV/RA/RVのPV loop、4腔pressure waveform、MV/AoV/TV/PuV flowの計12 panelを持ち、SLS-offを実線、SLS-onを破線で重ねる。各mode 801 sample、0--0.8 s、表示単位はmL、mmHg、mL/sである。外部CSS/JS、network fetchはなく、CSPとsource hash tableを含む。

静的visual auditで、テンプレートリテラル内の正規表現escapeが失われ、軸・tooltipの小数値の末尾1文字を削る表示バグを検出した。rendererを二重escapeへ修正し、生成HTMLに `replace(/\.$/, "")` が残る回帰testを追加して再生成した。raw SI JSON、数値積分、canonical artifact hashは変更していない。in-app browserはlocal `file://` URLを安全policyで拒否したため、その制約を迂回した実画面確認は行わず、自己完結性、script構文、panel/data inventory、renderer testで確認した。

## 心房PV形態

事前宣言した最小無次元lobe面積は `1e-3`。全4系列でqualified crossingは1個、ambiguous contactは0個、crossing angleは67--68 deg、2 lobeの符号は反対だった。

| atrium | SLS | classification | crossing angle (deg) | large lobe area | small lobe area (absolute) | small / large | small / threshold |
|---|---|---|---:|---:|---:|---:|---:|
| LA | off | indeterminate | 67.433 | 0.0363297 | 0.000109311 | 0.3009% | 10.93% |
| LA | on | indeterminate | 67.399 | 0.0361147 | 0.000111757 | 0.3095% | 11.18% |
| RA | off | indeterminate | 68.228 | 0.0405426 | 0.0000969802 | 0.2392% | 9.70% |
| RA | on | indeterminate | 68.363 | 0.0403603 | 0.0000990461 | 0.2454% | 9.90% |

SLS-onによりsmall lobeはLAで2.24%、RAで2.13%増え、large lobeはLAで0.59%、RAで0.45%減った。これはSLSがトポロジーを明瞭化した効果とは呼べない。fresh runは、幾何学的crossingはあるがv-lobe面積がlarge lobeの0.24--0.31%に潰れている、というユーザーの視覚的所見を支持する。

## LAP/RAPの尖り

| atrium | SLS | pressure min--max (mmHg) | peak phase (s) | maximum 1 ms jump (mmHg) | jump end phase (s) | max / p95 jump | event at jump end |
|---|---|---:|---:|---:|---:|---:|---|
| LA | off | 1.526--14.151 | 0.065 | 0.90875 | 0.059 | 5.455 | none |
| LA | on | 1.569--14.151 | 0.065 | 0.90855 | 0.059 | 5.460 | none |
| RA | off | 1.277--13.526 | 0.037 | 0.80779 | 0.030 | 5.354 | none |
| RA | on | 1.311--13.527 | 0.037 | 0.80755 | 0.030 | 5.437 | none |

SLS-onによる最大jumpの変化はLA `-0.022%`、RA `-0.030%`である。最大jump終点にevent keyはなく、上昇は複数の1 ms stepに分散している。したがって、これはevent transactionの不連続やSLSの数値artifactではない。現在の証拠が支持するのは「prescribed atrial Ca / Land active response、強いvolume unloading、one-fiber pressure mappingが重なる時間帯の急勾配」という候補までであり、active ownerの定量帰属はまだ確立しない。

なお、現project-synthetic runではLA最小volumeがSLS-off/onで1.76/1.83 mL、RAが5.05/5.11 mLまで低下し、LV/RV最大圧も約20.7/21.7 mmHgに留まる。これは正常生理波形として未較正であり、尖りやPV形態を正常ヒトのacceptance targetへ直接比較しない。

## Reservoir / conduit / pumpの同一容量解析

Canonical phase windowsは、AV main positive-flow lobeの閉鎖・開放crossingと次のatrial Ca driveで定義した。全境界は解決したが、各完全窓のvolumeは厳密単調ではなかった。

| phase | expected volume direction | observed substructure |
|---|---|---|
| LA reservoir | increasing | 開始直後にoff/onで1.470/1.453 mL低下してから54.523/54.450 mL増加 |
| RA reservoir | increasing | 開始直後にoff/onで1.203/1.183 mL低下してから60.359/60.292 mL増加 |
| LA conduit | decreasing | off/onで2.407/2.386 mLの増加成分と8.651/8.622 mLの低下成分を持ち、late refillを含む |
| RA conduit | decreasing | off/onで1.577/1.560 mLの増加成分と9.346/9.315 mLの低下成分を持ち、late refillを含む |
| LA pump | decreasing | 初期にoff/onで0.682/0.681 mL増加してから47.491/47.441 mL低下 |
| RA pump | decreasing | 初期にoff/onで0.519/0.515 mL増加してから51.907/51.870 mL低下 |

このため、完全phase window内の (P(V)) は一価のbranchではない。canonical artifactはmatched gridを空にし、`artifactIntegrityGatePass = false`、全6相 `ambiguous` とした。これはsimulation failureではなく、非単調branchへ同一容量補間を強行しないための数学的integrity resultであり、exit codeには影響させていない。source pressure reconstructionの最大残差は `4.547473508864641e-13 Pa`、SLS-off near-zero auditはpassした。

### 事後的な極値トリムによる記述統計

結果を見た後の説明に限り、reservoirを最初のvolume minimumからphase end、conduitを最初のvolume maximumからその後のminimumへ切り出した。平滑化とvolume toleranceは使わず、切り出し後のvolumeは1 ms grid上で厳密単調だった。

| atrium | SLS | common volume (mL) | mean \(P_{res}-P_{con}\) (mmHg) | min--max (mmHg) | positive-volume fraction | integrated gap (mmHg mL) |
|---|---|---:|---:|---:|---:|---:|
| LA | off | 47.764--56.282 | 0.35142 | 0.01088--0.88331 | 100% | 2.9933 |
| LA | on | 47.790--56.278 | 0.35418 | 0.01124--0.88424 | 100% | 3.0063 |
| RA | off | 56.228--65.405 | 0.19201 | 0.00663--0.51002 | 100% | 1.7622 |
| RA | on | 56.258--65.405 | 0.19473 | 0.00688--0.51431 | 100% | 1.7812 |

この記述範囲ではconduitはreservoirの下にあり、懸念された上下反転はfresh runでは認めない。ただし差は小さく、潰れたv-loopと整合する。高容量共通域でSLS-onが増やしたbranch gapはLA約0.00426 mmHg、RA約0.00377 mmHg、SLS-off gapの約1.22%と1.97%にすぎない。このrunではSLSが枝の上下関係を作ったとは考えにくい。

この切り出しは事後解析なので、canonical `ambiguous`、SLS因果帰属なし、生理学的validationなしを上書きしない。正式な解析へ昇格する場合は、極値の一意性・prominence、最小volume変化、トリム規則、3-grid収束を結果前にmanifestへ固定して再実行する。

## 心房Land parameterの文献判断

詳細は[心房Land文献・component監査](atrial-land-literature-and-component-audit-2026-07-16.md)へ分離した。

- v1はLand 2017の6-state active topologyを維持する。
- 現runtime base（`CaT50Ref = 0.805 uM`）はLand 2017のwhole-organ kineticsと、cellular/skinned列の `Tref = 40.5 kPa`を組み合わせたhybridであり、完全なintact-human atrial vectorとは呼ばない。
- Land--Niederer 2018の `CaT50Ref = 0.86 uM` とatrial `kws` mappingは、runtimeと区別したreproducible legacy candidateとして保持する。現isolated twitchのTTP 72 ms、RT50 38 msは同論文のmodel context 82/75 msと一致しない。
- Gerach 2021の `CaT50Ref = 1.05 uM`, `beta1 = -0.5 uM`をcontrolled candidateとして実装した。同一Ca/strain/`Tref`/wall adapterの0.25 ms比較で、isometric peak above baselineは16.328から4.169 kPa、absolute restretch-minus-holdは64.254から21.701 Paへ低下した。一方、active amplitudeで正規化したcomponentは0.004914から0.006283へ増えた。2 parameterを同時変更し、各candidateを固有平衡へburn-inするため、length sensitivityの単独同定、runtime採択、科学的棄却のいずれにも使わない。
- Strocchi 2023はhistory-matched ensembleであり、単一推奨vectorとして移植しない。
- Lewalle 2026のhuman LA force--Ca、passive force、quick-length/slack--restretch observableは独立target候補だが、公開モデルはOFF-stateとforce feedbackを追加した別topologyであり、そのparameterを6-state Landへ直接移植しない。
- PV loop形状をLand/Ca parameter fitting targetにしない。

Runtime defaultは今回変更していない。次段では、Ca source、one-fiber wall scale、`CaT50Ref`と`beta1`のfactorial separationをcomponent protocolで先に識別し、その後にHR/preload/LV relaxation/atrial activation-offのheld-out closed-loop testを行う。一状態SLSは残すが、v-loopを作る目的で調整せず、passive stress-relaxationと複数frequency dataからのみ昇格させる。

## 検証

- Phase A1 literature/component tests: 58 / 58 pass
- paired morphology/waveform/matched-volume/HTML/diagnostic tests: 39 / 39 pass
- Phase A1 strict verifier: pass, readiness SHA-256 `98f593ddd824920bd3261ecd50af840161160f896198e6ccf92de6d1fe8f564a`
- TypeScript `tsc --noEmit`: pass
- `git diff --check`: pass
- HTML decimal formatter regression: 4 / 4 focused tests pass after repair

## Claim boundary

この結果が支持するのは、project-synthetic normal-sinus、single-start、1 ms backward-Euler、SLS-off/on paired period-1 numerical evidenceと、そのterminal cycleから作ったdiagnostic artifactに限る。SLSの因果効果、active pressure owner、full-beat physiological acceptance、multi-start、3-grid timestep convergence、cycle-energy acceptance、disease envelope、Phase B1 acceptance、`ModelCore`統合、browser/runtime adoption、release reachabilityは支持しない。

Morphologyの結果はreport completenessだけをgateとし、`present`、`absent`、`indeterminate`のどれもexit conditionにしない。SLS-offで8の字を保持する条件は明示的に廃止したままである。
