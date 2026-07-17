# Main-wire accepted-interval diagnostic timebase V1

## 目的

exact-event Ca により accepted step が可変長になっても、診断量を sample
数や nominal `dt` ではなく、実際に受理された物理時間で定義するための
汎用 timebase である。この V1 は readback-only であり、循環・心筋・Ca の
動的 state や parameter を追加しない。

## accepted interval と所有権

各 interval (I_n) を

$$
I_n=(t_n,t_{n+1}]
$$

とする。interval は次を所有する。

- start time (t_n)
- end time (t_{n+1})
- duration (\Delta t_n=t_{n+1}-t_n>0)
- end time で受理された endpoint sample
- ((t_n,t_{n+1}]) に属する event

共有境界 (t_{n+1}) の event は左側 interval が一度だけ所有する。右側
interval の始点は開区間なので、その event を重複所有できない。同時刻に
異なる event が複数ある場合は、異なる `eventId` を持つ限り許容する。

retained window は、最初の interval の直前に受理された sample を必須とする。
その timestamp は window start に一致する。これにより差分量が必要な診断も、
window 外の暗黙の sample を仮定せずに計算できる。

validator は次を黙って補正せず、入力不正として棄却する。

- 時刻が有限で、interval が正の duration を持つこと
- interval が単調かつ隙間なく連続すること
- endpoint sample time が interval end と一致すること
- interval duration、duration の総和、window duration が各時刻差と一致すること
- event が時刻順で、割り当てられた ((start,end]) 内にあること
- 同一 `eventId` が window 内で一度だけ所有されること

時刻比較 tolerance は浮動小数点誤差のためだけにあり、生理 parameter ではない。

## endpoint quadrature

accepted endpoint の signal (y_{n+1}) に対し、backward-Euler endpoint
integral を

$$
I_{BE}=\sum_n y_{n+1}\Delta t_n
$$

とする。signed integral に加え、正部分と負部分を

$$
I_+=\sum_n\max(y_{n+1},0)\Delta t_n,
$$

$$
I_-=\sum_n\min(y_{n+1},0)\Delta t_n
$$

として返す。したがって (I_{BE}=I_++I_-) である。負部分の絶対量
(-I_-) も明示して、符号規約を呼び出し側に推測させない。

time-weighted mean は

$$
\bar y_t=\frac{I_{BE}}{\sum_n\Delta t_n}
$$

であり、不均一 interval の sample 数平均は用いない。同じ endpoint signal
を保ったまま interval を分割した場合、integral と mean は不変である。

## timestamp delay と weighted regression

event または sample 間の delay は、index や phase 差ではなく実 timestamp の差

$$
\Delta t=t_{late}-t_{early}\ge 0
$$

として計算する。

linear regression は endpoint time を説明変数、interval duration を重みとして

$$
\min_{a,b}\sum_n\Delta t_n
\left[y_{n+1}-(a+b t_{n+1})\right]^2
$$

を解く。例えば caller が正の excess pressure の対数を signal として渡せば、
指数減衰の時定数推定に使える。ただし、この generic kernel 自身は漸近圧、
fit window、対数変換、時定数の生理的意味を所有しない。

## claim boundary

この V1 が所有するのは、accepted physical time、interval/event ownership、
endpoint quadrature、time-weighted mean、timestamp delay、duration-weighted
linear regression のみである。

以下は主張しない。

- 生理指標の window や event 定義
- waveform の interpolation、resampling、smoothing
- 可変 step に対する新しい数値積分 scheme
- 心筋・循環・Ca state の更新
- parameter fitting や正常範囲 gate
- relaxation time constant の自動決定

既存の periodic summary / review / cycle diagnostics への配線は、各指標の
accepted-interval ownership を別途監査した後の段階とする。
