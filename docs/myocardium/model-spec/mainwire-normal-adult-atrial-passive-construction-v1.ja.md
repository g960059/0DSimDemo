# Main-wire normal-adult atrial passive construction V1

## 1. 目的

この V1 は、normal-adult five-wall model で使う心房受動構築を一つの immutable bundle にまとめる。
所有するのは次の項目だけである。

- Moyer 2015 human-LA 材料の incompressible equibiaxial reduction
- LA/RA の壁材料体積と血液量 anchor
- inverse-unloaded cavity volume $V_0$
- volume-to-fiber-log-strain 写像
- passive reference tangent $K_{\mathrm{eq,ref}}$
- 一状態 parallel SLS の無次元比、時定数、$E_v$ 導出規則
- `derived-on` / `exact-off` の構造比較軸

この変更は数値再調整ではない。既存 prior を一か所へ移し、owner と identity を明示する refactor である。
alternate passive law、parameter scan、PV-loop shape fitting は含まない。

## 2. 材料則と chamber kinematics

equilibrium passive は Moyer et al. の human-LA material を

$$
F=\operatorname{diag}(\lambda,\lambda,\lambda^{-2}),
\qquad e=\log\lambda
$$

へ厳密に縮約した既存 kernel を使う。係数は

$$
C_1=1650\ \mathrm{Pa},\quad C_2=0,\quad
C_3=15\ \mathrm{Pa},\quad C_4=13.37
$$

である。LA と RA は同じ材料 class を共有する。ただし human-LA 材料を RA に使うことは、
RA 材料をヒトで同定したという主張ではなく、明示的な cross-chamber extrapolation である。

心房血液量 $V_A$ と one-fiber log strain は

$$
e_A(V_A)=\frac13\log\left(
\frac{V_A+V_{w,A}/2}{V_{0,A}+V_{w,A}/2}
\right),
\qquad
\frac{de_A}{dV_A}=\frac{1}{3(V_A+V_{w,A}/2)}
$$

で結ぶ。したがって equilibrium passive pressure は virtual work から

$$
P_{A,\mathrm{eq}}
=V_{w,A}\,\sigma_{\mathrm{eq}}(e_A)\frac{de_A}{dV_A}
$$

となる。hidden blood-volume state、phase input、pressure offset はない。

固定 construction は次である。

| atrium | max / pre-A / min blood volume | wall material volume | inverse-unloaded $V_0$ | inverse anchor |
|---|---:|---:|---:|---:|
| LA | 80.18 / 57.95 / 35.72 mL | 25.982905982906 mL | 22.8900425619 mL | 35.72 mL at 5 mmHg |
| RA | 98.04 / 72.58 / 47.31 mL | 23.399810066477 mL | 32.5968711181 mL | 47.31 mL at 3.5 mmHg |

LA anchor は Moyer human-LA filling construction を zero external pressure の transmural anchor として解釈する。
RA anchor は control x-descent intracavitary pressure を同じ形に投影した construction であり、
直接測定された RA transmural pressure-volume relation ではない。

## 3. Reference tangent と一状態 SLS

SLS の reference は Moyer fiber recruitment origin の右接線 $e=0^+$ とする。

$$
K_{\mathrm{eq,ref}}
=24C_1+24C_2+C_3C_4
=39800.55\ \mathrm{Pa}.
$$

healthy ovine RV free-wall fast Prony branch から採用した係数と時定数は

$$
G_1=0.13,
\qquad
r_v=\frac{G_1}{1-G_1}=0.149425287356\ldots,
\qquad
\tau_v=0.30\ \mathrm{s}
$$

である。branch modulus は独立な自由 parameter とせず、

$$
E_{v,\mathrm{raw}}=r_vK_{\mathrm{eq,ref}}
=5947.208620689\ldots\ \mathrm{Pa},
$$

$$
E_v=\operatorname{round}_{1\ \mathrm{Pa}}(E_{v,\mathrm{raw}})
=5947\ \mathrm{Pa}
$$

と導出する。`round-to-nearest-Pa` は bundle identity の一部である。この丸めは既存
`5947 Pa` prior の machine-level parity を保つための明示的 representation policy であり、
PV loop に対する fit ではない。

SLS は

$$
\sigma_v=E_v(e-\alpha),
\qquad
\dot\alpha=\frac{e-\alpha}{\tau_v}
$$

という一つの Maxwell branch を equilibrium passive と active stress に並列接続する。
二本目の branch、phase-dependent gain、pressure-dependent gain は追加しない。

## 4. LA/RA class と比較 mode

bundle は LA と RA を別 key として明示する。両者は現在、同じ material/SLS class と
`derived-on` parameter object を共有するが、RA が暗黙に LA の付属物になる構造にはしない。

- `derived-on`: 上式から導出した $E_v=5947$ Pa、$\tau_v=0.30$ s
- `exact-off`: $E_v=0$。overstress、SLS stored energy、physical dissipation、BE numerical dissipationを厳密に 0 とする

既存 public API の `"on" | "exact-off"` は後方互換のため保持する。そこでは `"on"` を
LA/RA の `derived-on` へ写像し、`"exact-off"` は従来どおり LA だけを off、RA を derived-on に保つ。
bundle 自体は LA/RA の両方について `derived-on` / `exact-off` を解決できるため、将来の固定 ablation で
API を増殖させずに済む。

## 5. Identity と static gates

`normal-adult-atrial-passive-construction-v1` は次を一つの stable identity に含める。

- Moyer compiled parameter hash
- reference strain、reference tangent、その定義
- LA/RA の壁体積、$V_0$、血液量、inverse anchor、base strain
- $G_1$、$r_v$、$E_{v,\mathrm{raw}}$、丸め規則、$\tau_v$
- LA/RA ごとの derived-on / exact-off parameter identity
- claim boundary

live singleton は registry と deep freeze で保護し、hash の再計算一致を要求する。構築時には次を fail-fast にする。

1. Moyer compiled object が正規 kernel 由来であること
2. `max > pre-A > min > V0 >= 0`、$V_w>0$
3. 保存した base strain が volume mapping の再計算と bit-exact に一致すること
4. inverse anchor pressure replay が $10^{-10}$ mmHg 以内で一致すること
5. $K_{\mathrm{eq,ref}}$ が Moyer $e=0^+$ tangent と一致すること
6. $r_v=G_1/(1-G_1)$、$E_{v,\mathrm{raw}}=r_vK_{\mathrm{eq,ref}}$
7. derived-on が nearest-Pa rounding、exact-off が厳密な zero branch であること

現在の bundle hash は `0791114f` である。schema または owner を変更すれば hash は変更してよいが、
同じ schema のまま stale value を受理してはならない。

## 6. Five-wall provider への配線

`MainWireNormalAdultFiveWallProviderV1` は心房について、bundle から次を直接取得する。

- SI 単位へ変換した LA/RA geometry
- Moyer equilibrium passive evaluator
- atrium key と mode で解決した SLS parameters

Land active parameter、ventricular Klotz passive、TriSeg geometry はこの bundle の owner ではない。
five-wall prior は bundle の値を再公開するだけとし、既存 prior identity hash `02e09d03` を保持する。

## 7. 検証境界

`normalAdultAtrialPassiveConstructionV1.test.ts` は以下を固定する。

- bundle hash integrity、deep freeze、forgery rejection
- LA/RA construction の pre-refactor exact parity
- representative strain での Moyer stress/tangent の bit-exact replay
- unloaded zero pressure と LA 5 mmHg / RA 3.5 mmHg anchor replay
- $G_1\rightarrow r_v\rightarrow E_{v,\mathrm{raw}}\rightarrow5947$ Pa の導出
- LA/RA の `derived-on` / `exact-off` class
- provider claim と bundle identity の一致

既存 `normalAdultFiveWallPriorV1.test.ts` と
`mainWireNormalAdultFiveWallProviderV1.test.ts` も同時に通す。これにより prior hash、cold mechanics、
trial determinism、energy ledger、LA-only exact-off の既存挙動を維持する。

この refactor は Moyer 則の妥当性を新たに実証するものではなく、SLS parameter を患者同定したものでもない。
将来 law を比較するときは、この bundle 内へ alternate law を足すのではなく、別 identity の構造候補として
同じ独立データ gate で比較する。
