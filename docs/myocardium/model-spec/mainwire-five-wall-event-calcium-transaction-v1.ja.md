# Main-wire five-wall event calcium transaction V1

## 目的と境界

この段階では、既存の HR 60 の規則的 biexponential Ca 波形を変えずに、将来の不整脈 schedule を受け取れる最小の状態表現へ移す。

- 5 壁（LA、RA、LVFW、SEP、RVFW）それぞれに 2 状態、合計 10 状態を置く。
- Ca event の時刻と壁選択は scheduler が所有し、Ca kernel から分離する。
- circulation、five-wall mechanics、Ca state を一つの accepted transaction として commit / rollback する。
- SR、RyR、SERCA、restitution、refractory period はこの V1 では所有しない。
- 波形 parameter の探索や PV loop 形状 fitting は行わない。

したがって、これは保存的 intracellular Ca cycling model ではなく、event-driven prescribed Ca model である。

## 2 状態 kernel

各壁 (w) の状態を

$$
x_w=(r_w,d_w)
$$

とし、event 間では

$$
\dot r_w=-\frac{r_w}{\tau_r},
\qquad
\dot d_w=-\frac{d_w}{\tau_d}
$$

を厳密指数解で進める。壁選択 event (e_k) が時刻 (t_k) に strength (s_{k,w}\ge0) を与えると、

$$
r_w^+=r_w^-+s_{k,w},
\qquad
d_w^+=d_w^-+s_{k,w}.
$$

出力は

$$
Ca_w=C_{\mathrm{rest}}+G(d_w-r_w)
$$

である。同じ event increment が両状態に入るため、event 直前直後で (d_w-r_w) と (Ca_w) は連続である。

## 既存 HR 60 波形との解析的同値性

既存の周期的 biexponential は、周期 (T) に対して

$$
r(0^+)=\frac{1}{1-e^{-T/\tau_r}},
\qquad
d(0^+)=\frac{1}{1-e^{-T/\tau_d}}
$$

という period-one event state へ解析的に写す。peak-to-trough excursion から (G) と (C_{\mathrm{rest}}) を一意に決めるため、parameter fitting はない。

canonical initialization は

`regular-periodic-prehistory-from-fixed-prior`

であり、壁別 Ca onset から現在時刻までを厳密指数伝播して初期状態を作る。これは開始時刻より前の fixed-prior 規則刺激履歴を所有する initializer であり、開始時刻以後の future schedule とは別の owner である。

canonical run はこの prehistory と fixed sinus future schedule を組み合わせる。一方、生理的な規則 rhythm から PAC / PVC / dropped beat へ遷移する実験では、この prehistory を明示的に選んだまま、hashable な explicit future schedule を与えられる。したがって、任意 schedule を暗黙に周期初期化することはないが、規則的履歴から不整脈へ移る境界は保持する。

長い event-free interval から開始する明示 irregular schedule には

`event-free-rest`

を用意する。この initializer は exact-event output 専用であり、analytic periodic control とは混用しない。

## control と challenger

accepted state は両表現で同じ 10 状態を所有する。

1. `analytic-periodic-control-with-exact-event-shadow`
   - mechanics への Ca 出力は従来の解析的周期関数を使う。
   - 同時に exact-event state を shadow として atomic に更新する。
2. `exact-event-state`
   - mechanics への Ca 出力を 10 状態から計算する。

これにより、規則的 HR 60 では同一 parameter・同一 state trajectory のまま出力表現だけを比較できる。control と challenger は protocol identity で明確に区別される。

## scheduler ownership

V1 の canonical scheduler は fixed sinus provider である。

- ventricular event: cycle 内の ventricular electrical-to-Ca delay
- atrial event: cycle end - AV delay + atrial electrical-to-Ca delay
- atrial event は LA / RA を選択する。
- ventricular event は LVFW / SEP / RVFW を選択する。

explicit provider は有限 event list と壁別 strength を受け取れるため、PAC、PVC、dropped beat、wall-selective stimulus へ拡張できる。ただし、refractoriness や restitution はまだ scheduler の外側にも実装していない。

同じ表示用 `scheduleId` で内容が異なる schedule を混同しないよう、provider は timing と wall strength を含む deterministic `scheduleIdentityHash` を持つ。accepted state と protocol identity はこの hash も照合する。

## atomic transaction

候補時刻 (t_{n+1}) では、前 accepted state を変更せずに次を評価する。

1. scheduler から ((t_n,t_{n+1}]) の event を取得する。
2. candidate Ca state と candidate Ca output を計算する。
3. candidate circulation と candidate five-wall mechanics を Newton trial として評価する。
4. 全 trial の revision、時刻、入力 identity が一致し、circulation / mechanics が成功した場合だけ三者を同時 commit する。

失敗時は circulation、mechanics、Ca の revision、accepted time、全 state を bit-exact に rollback する。

## off-grid event

exact-event output では、mechanics interval の内部に Ca event を置かない。runner は nominal step の途中に event があれば、その時刻を accepted substep boundary にする。これは失敗時だけ刻みを細かくする rescue substep ではなく、事前に event schedule から決まる時間分割である。

`stepsPerBeat` は nominal grid 数を表す。exact-event run の accepted substep 数は event 分割によりこれを上回り得る。既存の uniform-dt summary はこの可変 substep trace を生理指標へ誤積分しないよう、別途 variable-dt readback 対応が必要である。

浮動小数点で late-cycle endpoint が event より数 ulp 後ろになる場合は、time-scale に比例した機械精度 tolerance で endpoint event と判定する。event を恣意的に移動する生理 parameter ではない。

## period-one closure と protocol identity

formal closure は従来の circulation、valve、TriSeg、Land、SLS、wall input history に加え、

$$
\{r_w,d_w\}_{w\in\{LA,RA,LVFW,SEP,RVFW\}}
$$

の全 10 状態を比較する。

protocol identity は少なくとも次を含む。

- output representation
- Ca state schema id / version
- event kernel id
- analytic periodic-to-event conversion id
- scheduler id / scheduler content hash
- initialization owner
- fixed Ca parameter hash

異なる representation、initialization、scheduler content、state schema の orbit を同じ protocol として比較しない。

## この段階で主張しないこと

- conserved cellular Ca handling
- rate-dependent restitution
- refractory behavior
- alternans mechanism の再現
- irregular rhythm の臨床妥当性
- PV loop morphology の改善
- ModelCore runtime への採用

この V1 の acceptance は、既存 HR 60 waveform の機械精度再現、wall-selective event、off-grid split、atomic rollback、10-state period closure、identity separation に限定する。
