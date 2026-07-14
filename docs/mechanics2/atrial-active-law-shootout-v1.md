# Atrial active-law shootout V1

Status: component-level causal screen only. This is not runtime adoption,
closed-loop physiology acceptance, experimental validation, a patient fit, or
winner selection.

## Question

PR #467 can produce a late rise in atrial active tension while LA volume is
already close to its minimum. The purpose of this bench is to separate three
candidate owners of that behavior without changing chamber geometry, valves,
circulation, passive stress, or SLS stress:

1. the project-specific 25 ms normalized thin-filament availability lag;
2. the instantaneous classical Hill force--velocity multiplier;
3. their interaction.

Land 2017 with atrial literature overrides is included as an external
mechanistic comparator. It is not included as a fifth level of either factor.

## Factorial design

The Hill arms form a complete two-by-two comparison. Every arm receives the
same dimensional prescribed free-calcium samples and the same prescribed total
fiber log-strain samples.

| arm | thin-filament treatment | explicit force--velocity treatment |
|---|---|---|
| `hill-algebraic-classical-fv` | normalized algebraic gate | classical Hill |
| `hill-lag25-classical-fv` | project 25 ms normalized lag | classical Hill |
| `hill-algebraic-fv-near-unity` | normalized algebraic gate | near-unity classical-law parameter limit |
| `hill-lag25-fv-near-unity` | project 25 ms normalized lag | near-unity classical-law parameter limit |

The fifth arm, `land2017-atrial-active-only`, advances the tracked Land source
states `CaTRPN, B, W, S, zetaW, zetaS`. It receives no external SEE, post-hoc
`fV`, stress gain, passive stress, or SLS stress. The atrial prior records the
Land--Niederer 2018 changes `CaT50Ref = 0.86 uM` and `kws = 3 * 12 = 36 1/s`.
In the tracked Land parameterization, scaling source `kws` also scales derived
`ksu` by three while all derived rates are recomputed from the source
relations. These overrides are a human-atrial literature prior, not a normal-
human reference, patient fit, or digitized experimental target fit. The paper
itself notes limited human atrial cellular data and inherits most parameters
from the ventricular model.

The effective-rate provenance is recorded separately from the base ventricular
source rows. In units of `1/s`, `kws` changes `12 -> 36`, derived `ksu` changes
`18 -> 54`, derived `cs` changes `40.14 -> 120.42`, derived `kwu` changes
`170 -> 146`, and derived `cw` remains `405.86`. The parameter-pack hash covers
both the base equation-set hash and these atrial override/derivation rows.

This arm reuses the Land--Niederer rate and sensitivity overrides under the
common project calcium input. It does **not** reproduce the paper's calibrated
atrial baseline: the paper assumed an uncalibrated Brixius-shaped calcium range
of `0.1--0.6 uM`, whereas this causal bench's synthetic common trace spans
approximately `0.10--0.85 uM`. Consequently, the paper's reported 1 Hz
isometric `TPT = 82 ms` and `RT50 = 75 ms` are calibration context, not targets
met by this bench.

The near-unity arms keep the shared constitutive implementation and its default
parameter schema untouched. They approach `fV = 1` through a preregistered
classical-law parameter limit (`vmax = 1e9 1/s`, curvature ratio `1e6`,
lengthening factor `1`) and gate the retained factor within `1e-6` of unity.
This is a numerical causal ablation, not a physiological runtime law or a claim
of mathematically exact unity.

## Land active-only adapter

The source equations use Land stretch, while the chamber shell uses natural
log strain. V1 states the mapping explicitly:

```text
lambda_L = lambda_L,slack exp(e_f)
tau_active = lambda_L T_a
```

Here `T_a` is treated as nominal active stress conjugate to Land stretch and
`tau_active` is Kirchhoff stress conjugate to `e_f`. Therefore the continuous
power identity is

```text
tau_active de_f/dt = T_a dlambda_L/dt.
```

The readback checks both this continuous identity and an exact finite-step
discrete-gradient identity. It additionally compares against the source
solver's independently reported active power and a centered finite-difference
evaluation of `dlambda_L/de_f`. Initial Land populations are not arbitrary.
They are constructed from the analytic zero-rate equilibrium at the initial
Land stretch and diastolic free calcium. States use immutable arrays and commit
performs a defensive copy, so a committed state cannot alias-mutate its trial.

The `tau=lambda_L*T_a` map follows the repository's accepted interpretation of
Land `T_a` as nominal stress conjugate to engineering fiber strain. The primary
finite-element paper's tensor convention still requires an explicit virtual-
power reconciliation before runtime promotion; this bench does not settle that
separate convention question.

## Common protocols

The primary run uses a 1.0 s cycle (nominal HR60), `dt = 1 ms`, six cycles, and
retains raw 2 ms vertices for visualization. The causal trajectory starts LA-
like shortening immediately after calcium release, maps approximately 80 to 61
mL through the unchanged PR #467 spherical one-fiber geometry, then holds
length. Additional isometric, 15 ms quick-release, and eccentric-lengthening
protocols are report-only.

All arms reuse one generated calcium/strain sample array per protocol. The
artifact stores a deterministic input hash for each array.

## Result of the causal two-by-two

The primary `a-wave-shortening-stop` result is:

| arm | peak phase | remaining shortening at peak | post-stop gain / peak |
|---|---:|---:|---:|
| Hill algebraic + classical `fV` | 0.168 | 0.672 | 0.0078 |
| Hill lag25 + classical `fV` | **0.318** | **0.000** | **0.0405** |
| Hill algebraic + near-unity `fV` | 0.152 | 0.782 | 0.0000 |
| Hill lag25 + near-unity `fV` | 0.188 | 0.524 | 0.0000 |
| atrial Land active-only | 0.176 | 0.614 | 0.0000 |

The Hill difference-in-differences for peak phase is `+0.114 cycle`, for
own-peak-normalized post-stop gain it is `+0.0327`, and for raw post-stop gain
it is approximately `+0.702 kPa`. The normalized statistic is a shape
diagnostic with a different peak denominator in each arm; it is not a physical
stress interaction by itself. Under this fixed component protocol,
neither lag25 alone nor classical `fV` alone reproduces the late zero-remaining-
shortening peak. The large delay is an interaction: lag preserves availability
while the instantaneous `fV` branch recovers as CE shortening decelerates and
stops.

This is causal evidence about the current reduced closure, not evidence that
the Land arm is physiologically correct. Raw peak amplitudes are not compared
as scores because the Hill and Land maximum-tension scales were not fitted or
matched.

## Numerical status

All component trajectories completed. Hill CE--SEE serial residuals, Land state
positivity/conservation, absence of projection, independent Land work checks,
and the `1e-6` near-unity factor bound pass. Repeating the causal protocol at
`dt = 0.5 ms` changes peak stress by:

- 0.116%: Hill algebraic + classical `fV`;
- 0.537%: Hill lag25 + classical `fV`;
- 0.0006%: Hill algebraic + near-unity `fV`;
- 0.020%: Hill lag25 + near-unity `fV`;
- 0.051%: atrial Land active-only.

Peak phase is unchanged at the retained resolution for every arm. Time-step
refinement remains a numerical report, not a physiology gate.

## Decision and next gate

No active law is promoted by this bench. The immediate consequences are:

1. do not tune SLS or chamber geometry to compensate for this late peak;
2. do not invent a new finite-rate two- or three-state law before the Land and
   measured atrial protocol responses are established;
3. digitize atrial force--calcium, twitch timing, length-step/quick-release, and
   force--velocity targets with source and temperature metadata;
4. replay the actual accepted PR #467 LA strain and calcium histories through
   this same adapter boundary;
5. if the evidence remains favorable, create a new LA-only closed-loop V2 with
   Land active-only plus the existing independently owned passive and one-state
   SLS branches; do not put Land in series with an additional SEE;
6. only after LA-only numerical and morphology checks, extend the material
   abstraction to the remaining walls and TriSeg.

CircAdapt remains an external oracle until an exact version, license boundary,
activation interface, stress convention, and source hash are locked.

## Artifacts

- `data/mechanics2/reports/atrial-active-law-shootout-v1.json`
- `data/mechanics2/visuals/atrial-active-law-shootout-v1.html`

The HTML defaults to per-arm normalized shape view and can switch to raw
amplitude. It shows active stress, sphere-projected active pressure versus LA
volume, common calcium/strain forcing, explicit Hill `fV`, and causal metrics.
It uses raw retained vertices joined by straight segments with no smoothing.

Reproduce both artifacts with:

```sh
npm run verify:atrial-active-law-shootout-v1
npm run render:atrial-active-law-shootout-v1
```

## Primary references

1. Hill AV. The heat of shortening and the dynamic constants of muscle.
   Proc R Soc B. 1938. <https://doi.org/10.1098/rspb.1938.0050>
2. Land S, Park-Holohan SJ, Smith NP, et al. A model of cardiac contraction
   based on novel measurements of tension development in human cardiomyocytes.
   J Mol Cell Cardiol. 2017. <https://doi.org/10.1016/j.yjmcc.2017.03.008>
3. Land S, Niederer SA. Influence of atrial contraction dynamics on cardiac
   function. Int J Numer Method Biomed Eng. 2018.
   <https://doi.org/10.1002/cnm.2931>
